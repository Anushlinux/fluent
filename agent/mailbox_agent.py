import os
import json
from uuid import uuid4
from datetime import datetime
import time

from uagents import Agent, Context, Protocol, Model
from uagents_core.contrib.protocols.chat import (
    ChatMessage,
    ChatAcknowledgement,
    StartSessionContent,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)


class HealthResponse(Model):
    status: str
    agent: str
    timestamp: int
    metta_initialized: bool
    supabase_connected: bool

import requests
from hyperon import MeTTa
from dotenv import load_dotenv

load_dotenv()

# Supabase imports
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️  Supabase library not installed. Install with: pip install supabase")

# ======= ASI:ONE CONFIG =======
ASI_ONE_API_KEY = os.environ.get("ASI_ONE_API_KEY")
if not ASI_ONE_API_KEY:
    raise ValueError("ASI_ONE_API_KEY is not set. Add it to your .env file.")

ASI_ONE_API_URL = "https://api.asi1.ai/v1/chat/completions"

# ======= SUPABASE CONFIG =======
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
supabase_client: Client | None = None

if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client initialized")
else:
    print("⚠️  Supabase not configured (optional)")

# ======= REST API MODELS =======
class SentenceRequest(Model):
    sentence: str
    url: str = ""
    user_id: str = ""

class SentenceResponse(Model):
    explanation: str
    concepts: list
    relations: list
    context: str
    captured: bool
    timestamp: int

class GraphAnalysisRequest(Model):
    query_type: str = "overview"  # overview, learning_path, clusters, gaps
    user_context: str = ""

class GraphAnalysisResponse(Model):
    analysis: str
    insights: list
    suggestions: list
    timestamp: int

# ======= METTA KNOWLEDGE GRAPH =======
metta = MeTTa()

# Seed initial Web3 knowledge
initial_kg = """
    (concept erc4337 account_abstraction)
    (relation enables erc4337 paymaster)
    (concept relayer bundler)
    (relation involved erc4337 relayer)
"""
metta.run(initial_kg)

# ======= HELPER FUNCTIONS =======

def validate_and_parse_json(response_text: str, default_value: dict) -> dict:
    """
    Validate and parse JSON response from ASI:One.
    Returns default_value if parsing fails.
    """
    try:
        # Try direct JSON parse first
        return json.loads(response_text)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1
        if json_start != -1 and json_end > json_start:
            try:
                return json.loads(response_text[json_start:json_end])
            except json.JSONDecodeError:
                pass
        return default_value

def extract_concepts_llm(text: str):
    """Use ASI:One asi1-mini to extract Web3 concepts with structured output."""
    try:
        response = requests.post(
            ASI_ONE_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ASI_ONE_API_KEY}"
            },
            json={
                "model": "asi1-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a Web3 concept extraction assistant. Be concise and structured. Respond ONLY with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": f"""Extract Web3 concepts from: {text}

Respond with ONLY this JSON structure (no markdown, no explanation):
{{
  "terms": ["term1", "term2"],
  "context": "DeFi|NFT|SmartContract|Web3|General",
  "relations": [["subject", "predicate", "object"]]
}}

Maximum 5 terms. Keep relations concise."""
                    }
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.7,
                "max_tokens": 200
            },
            timeout=30
        )
        
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        return validate_and_parse_json(content, {
            "terms": [], 
            "context": "General", 
            "relations": []
        })
    except Exception as e:
        print(f"[ASI:One Error]: {e}")
        return {"terms": [], "context": "General", "relations": []}


def asi_one_explain(text: str, known_concepts: list = None) -> str:
    """Use ASI:One asi1-mini for concise explanations."""
    try:
        if known_concepts and len(known_concepts) > 0:
            prompt = f"User knows: {', '.join(known_concepts[:3])}. Explain this Web3 concept in ONE clear sentence (max 25 words): {text}"
        else:
            prompt = f"Explain this Web3 concept in ONE simple sentence for beginners (max 25 words): {text}"
        
        response = requests.post(
            ASI_ONE_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ASI_ONE_API_KEY}"
            },
            json={
                "model": "asi1-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a concise Web3 educator. Explain concepts in ONE sentence maximum. Be direct and clear."
                    },
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 100
            },
            timeout=30
        )
        
        response.raise_for_status()
        result = response.json()
        explanation = result['choices'][0]['message']['content'].strip()
        
        # Ensure single sentence
        if '.' in explanation:
            explanation = explanation.split('.')[0] + '.'
        
        return explanation
    except Exception as e:
        print(f"[ASI:One Explain Error]: {e}")
        return f"Unable to generate explanation: {str(e)}"


def export_metta_graph() -> str:
    """Export MeTTa knowledge graph as JSON string."""
    try:
        # Query all concepts
        concept_query = "!(match &self (concept $x $ctx) ($x $ctx))"
        concept_results = metta.run(concept_query)
        
        # Query all relations
        relation_query = "!(match &self (relation $pred $subj $obj) ($pred $subj $obj))"
        relation_results = metta.run(relation_query)
        
        # Parse results into structured format
        concepts = []
        if concept_results:
            for result in concept_results:
                if isinstance(result, list) and len(result) >= 2:
                    concepts.append({
                        "term": str(result[0]),
                        "context": str(result[1])
                    })
        
        relations = []
        if relation_results:
            for result in relation_results:
                if isinstance(result, list) and len(result) >= 3:
                    relations.append({
                        "predicate": str(result[0]),
                        "subject": str(result[1]),
                        "object": str(result[2])
                    })
        
        graph_data = {
            "concepts": concepts,
            "relations": relations,
            "metadata": {
                "total_concepts": len(concepts),
                "total_relations": len(relations),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        return json.dumps(graph_data, indent=2)
    except Exception as e:
        print(f"[MeTTa Export Error]: {e}")
        return json.dumps({"concepts": [], "relations": [], "metadata": {"error": str(e)}})


def asi_one_graph_reasoning(graph_data: str, query_type: str = "overview") -> dict:
    """Use ASI:One asi1-graph for structured graph analysis."""
    try:
        prompts = {
            "overview": f"""Analyze this Web3 knowledge graph.

Graph data: {graph_data}

Respond with ONLY this JSON (no markdown):
{{
  "summary": "2-3 sentence overview",
  "insights": ["insight1", "insight2", "insight3"],
  "suggestions": ["suggestion1", "suggestion2"]
}}

Keep insights to 1 sentence each. Maximum 3 insights, 2 suggestions.""",
            
            "learning_path": f"""Suggest optimal learning sequences from this graph.

Graph data: {graph_data}

Respond with ONLY this JSON:
{{
  "summary": "Brief learning path overview",
  "insights": ["path step 1", "path step 2", "path step 3"],
  "suggestions": ["next topic 1", "next topic 2"]
}}""",
            
            "clusters": f"""Identify topic clusters in this graph.

Graph data: {graph_data}

Respond with ONLY this JSON:
{{
  "summary": "Cluster overview",
  "insights": ["cluster 1 description", "cluster 2 description", "cluster 3 description"],
  "suggestions": ["connection 1", "connection 2"]
}}""",
            
            "gaps": f"""Find missing connections in this graph.

Graph data: {graph_data}

Respond with ONLY this JSON:
{{
  "summary": "Gap analysis overview",
  "insights": ["gap 1", "gap 2", "gap 3"],
  "suggestions": ["explore topic 1", "explore topic 2"]
}}"""
        }
        
        prompt = prompts.get(query_type, prompts["overview"])
        
        response = requests.post(
            ASI_ONE_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ASI_ONE_API_KEY}"
            },
            json={
                "model": "asi1-graph",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a knowledge graph analyst. Provide structured, concise analysis. Always respond with valid JSON only."
                    },
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.7,
                "max_tokens": 500
            },
            timeout=60
        )
        
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        parsed = validate_and_parse_json(content, {
            "summary": "",
            "insights": [],
            "suggestions": []
        })
        
        # Ensure we have the analysis field for backward compatibility
        return {
            "analysis": parsed.get("summary", ""),
            "insights": parsed.get("insights", [])[:5],
            "suggestions": parsed.get("suggestions", [])[:3]
        }
    except Exception as e:
        print(f"[ASI:One Graph Reasoning Error]: {e}")
        return {
            "analysis": f"Error analyzing graph: {str(e)}",
            "insights": [],
            "suggestions": []
        }


def add_to_metta_kg(analysis: dict):
    """
    Take LLM output and auto-add concepts/relations to MeTTa knowledge graph.
    """
    terms = analysis.get("terms", [])
    context = analysis.get("context", "General")
    relations = analysis.get("relations", [])
    
    # Add concepts to MeTTa
    for term in terms:
        term_clean = term.lower().replace(" ", "_")
        atom = f"(concept {term_clean} {context.lower().replace(' ', '_')})"
        try:
            metta.run(atom)
            print(f"[MeTTa] Added: {atom}")
        except Exception as e:
            print(f"[MeTTa Error] Could not add {atom}: {e}")
    
    # Add relations to MeTTa
    for rel in relations:
        if len(rel) >= 3:
            subj = rel[0].lower().replace(" ", "_")
            pred = rel[1].lower().replace(" ", "_")
            obj = rel[2].lower().replace(" ", "_")
            atom = f"(relation {pred} {subj} {obj})"
            try:
                metta.run(atom)
                print(f"[MeTTa] Added: {atom}")
            except Exception as e:
                print(f"[MeTTa Error] Could not add {atom}: {e}")


def metta_reasoning(query: str):
    """Query MeTTa knowledge graph with pattern matching."""
    try:
        if not query.startswith('!'):
            query = f"!{query}"
        result = metta.run(query)
        return result if result else "No results found in knowledge graph."
    except Exception as e:
        return f"MeTTa error: {e}"


def get_unexplored_concepts():
    """
    Query MeTTa for all concepts in the graph.
    (You can extend this to track user-specific explored vs. unexplored.)
    """
    try:
        query = "!(match &self (concept $x $ctx) $x)"
        result = metta.run(query)
        return result
    except Exception as e:
        return f"Error: {e}"


async def store_to_supabase(sentence: str, url: str, user_id: str, analysis: dict):
    """Store captured sentence in Supabase database."""
    if not supabase_client or not user_id:
        return False
    
    try:
        data = {
            "id": str(uuid4()),
            "user_id": user_id,
            "sentence": sentence,
            "terms": analysis.get("terms", []),
            "context": analysis.get("context", "General"),
            "framework": analysis.get("framework"),
            "confidence": 85,  # Default confidence
            "timestamp": datetime.utcnow().isoformat(),
            "url": url
        }
        
        result = supabase_client.table("captured_sentences").insert(data).execute()
        print(f"✅ Stored to Supabase: {sentence[:50]}...")
        return True
    except Exception as e:
        print(f"❌ Supabase storage error: {e}")
        return False


# ======= CHAT PROTOCOL =======
chat_proto = Protocol(name="chat", version="1.0.0", spec=chat_protocol_spec)


@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages with LLM, MeTTa, and auto-learning."""
    ctx.logger.info(f"Received chat from {sender}")
    
    # Send acknowledgement
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.utcnow(), 
        acknowledged_msg_id=msg.msg_id
    ))
    
    for item in msg.content:
        if isinstance(item, TextContent):
            user_text = item.text
            
            # ===== COMMAND ROUTING =====
            
            # 1. MeTTa direct query
            if user_text.lower().startswith("metta:"):
                metta_query = user_text[len("metta:"):].strip()
                result = metta_reasoning(metta_query)
                response_text = f"🔗 **[MeTTa Query]**\n`{metta_query}`\n\n**Result:**\n{result}"
            
            # 2. Show unexplored concepts
            elif user_text.lower() == "show unexplored":
                concepts = get_unexplored_concepts()
                response_text = f"📚 **All Concepts in Knowledge Graph:**\n{concepts}"
            
            # 3. Graph analysis using ASI:One asi1-graph
            elif user_text.lower() == "graph analysis":
                graph_data = export_metta_graph()
                analysis_result = asi_one_graph_reasoning(graph_data, query_type="overview")
                response_text = (
                    f"📊 **[Graph Analysis - ASI:One asi1-graph]**\n\n"
                    f"{analysis_result['analysis']}\n\n"
                    f"**Key Insights:**\n"
                    f"{chr(10).join('• ' + insight for insight in analysis_result['insights'][:3])}"
                )
            
            # 4. Normal chat: LLM + Auto-add to MeTTa
            else:
                # Extract concepts using LLM
                analysis = extract_concepts_llm(user_text)
                
                # Auto-add to MeTTa knowledge graph
                add_to_metta_kg(analysis)
                
                # Format response
                response_text = (
                    f"🔍 **Web3 Concept Analysis**\n\n"
                    f"**Extracted Terms:** {', '.join(analysis.get('terms', []))}\n"
                    f"**Context:** {analysis.get('context', 'General')}\n"
                    f"**Relations Found:** {len(analysis.get('relations', []))}\n\n"
                    f"✅ **Knowledge graph updated with new concepts!**\n\n"
                    f"💡 Try: `metta: (match &self (concept $x account_abstraction) $x)` to query the graph."
                )
            
            # Send response
            response = ChatMessage(
                msg_id=uuid4(),
                timestamp=datetime.utcnow(),
                content=[TextContent(type="text", text=response_text)]
            )
            await ctx.send(sender, response)
            
        elif isinstance(item, StartSessionContent):
            ctx.logger.info(f"Session started with {sender}")
        elif isinstance(item, EndSessionContent):
            ctx.logger.info(f"Session ended with {sender}")


@chat_proto.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Received ack from {sender} for message {msg.acknowledged_msg_id}")


# ======= AGENT SETUP =======
agent = Agent(
    name="FluentAgent",
    port=8010,
    endpoint=["http://localhost:8010/submit"],
    mailbox=True,
    publish_agent_details=True,
    readme_path="README.md"
)

agent.include(chat_proto, publish_manifest=True)

# ======= REST ENDPOINTS =======
@agent.on_rest_post("/explain-sentence", SentenceRequest, SentenceResponse)
async def handle_explain_sentence(ctx: Context, req: SentenceRequest) -> SentenceResponse:
    """
    REST endpoint for extension to send sentences for explanation.
    Processes with LLM, stores in MeTTa + Supabase, returns simple explanation.
    """
    ctx.logger.info(f"📥 Received sentence: {req.sentence[:60]}...")
    
    try:
        # Extract concepts using LLM
        analysis = extract_concepts_llm(req.sentence)
        
        # Generate personalized explanation using ASI:One
        known_concepts = analysis.get("terms", [])
        explanation = asi_one_explain(req.sentence, known_concepts)
        
        # Add to MeTTa knowledge graph
        add_to_metta_kg(analysis)
        
        # Store in Supabase (if configured and user authenticated)
        captured = False
        if req.user_id:
            captured = await store_to_supabase(
                req.sentence, 
                req.url, 
                req.user_id, 
                analysis
            )
        
        return SentenceResponse(
            explanation=explanation,
            concepts=analysis.get("terms", []),
            relations=analysis.get("relations", []),
            context=analysis.get("context", "General"),
            captured=captured,
            timestamp=int(time.time())
        )
    except Exception as e:
        ctx.logger.error(f"❌ Error processing sentence: {e}")
        return SentenceResponse(
            explanation=f"Error: {str(e)}",
            concepts=[],
            relations=[],
            context="Error",
            captured=False,
            timestamp=int(time.time())
        )

@agent.on_rest_get("/health", HealthResponse)
async def health_check(ctx: Context) -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        agent="FluentAgent",
        timestamp=int(time.time()),
        metta_initialized=True,
        supabase_connected=supabase_client is not None
    )

@agent.on_rest_post("/graph-analysis", GraphAnalysisRequest, GraphAnalysisResponse)
async def handle_graph_analysis(ctx: Context, req: GraphAnalysisRequest) -> GraphAnalysisResponse:
    """
    REST endpoint for advanced graph analysis using ASI:One asi1-graph.
    Analyzes the MeTTa knowledge graph and provides insights.
    """
    ctx.logger.info(f"📊 Graph analysis requested: {req.query_type}")
    
    try:
        # Export current MeTTa knowledge graph
        graph_data = export_metta_graph()
        
        # Add user context if provided
        if req.user_context:
            graph_data_with_context = f"{graph_data}\n\nUser Context: {req.user_context}"
        else:
            graph_data_with_context = graph_data
        
        # Perform graph reasoning with ASI:One asi1-graph
        result = asi_one_graph_reasoning(graph_data_with_context, req.query_type)
        
        return GraphAnalysisResponse(
            analysis=result["analysis"],
            insights=result["insights"],
            suggestions=result["suggestions"],
            timestamp=int(time.time())
        )
    except Exception as e:
        ctx.logger.error(f"❌ Error in graph analysis: {e}")
        return GraphAnalysisResponse(
            analysis=f"Error analyzing graph: {str(e)}",
            insights=[],
            suggestions=[],
            timestamp=int(time.time())
        )

print(f"🚀 Fluent Advanced Agent Starting...")
print(f"📧 Agent address: {agent.address}")
print(f"🌐 Available at: http://0.0.0.0:8010")
print(f"🔑 ASI:One API: {'✅ Set' if ASI_ONE_API_KEY else '❌ Not set'}")
print(f"🧠 MeTTa Knowledge Graph: Initialized")
print(f"📊 ASI:One Models: asi1-mini (extraction), asi1-graph (reasoning)")

if __name__ == "__main__":
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Agent stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
