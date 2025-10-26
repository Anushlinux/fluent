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

class GapDetectionRequest(Model):
    user_id: str
    user_xp: int = 0
    history_context: str = ""

class GapDetectionResponse(Model):
    gaps: list  # [{cluster: str, missing_concepts: list, confidence: float}]
    suggestions: list  # [str]
    timestamp: int

class QuizGenerationRequest(Model):
    user_id: str
    gap_cluster: str
    difficulty: int = 2  # 1-3

class QuizQuestion(Model):
    question: str
    options: list  # [str, str, str, str]
    correct: str  # 'a', 'b', 'c', or 'd'
    explanation: str

class QuizGenerationResponse(Model):
    questions: list  # [QuizQuestion]
    cluster: str
    difficulty: int
    timestamp: int

class BadgeImageRequest(Model):
    domain: str
    score: int
    node_count: int
    concepts: list = []  # User's captured concepts
    format: str = "square"  # square, story, certificate, poster, banner

class BadgeImageResponse(Model):
    image_data: str  # base64 encoded
    prompt_used: str
    generation_time: float
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
            "url": url,
            "asi_extract": {
                "explanation": analysis.get("explanation", ""),
                "concepts": analysis.get("terms", []),
                "relations": analysis.get("relations", [])
            }
        }
        
        result = supabase_client.table("captured_sentences").insert(data).execute()
        print(f"✅ Stored to Supabase: {sentence[:50]}...")
        return True
    except Exception as e:
        print(f"❌ Supabase storage error: {e}")
        return False


async def fetch_user_graph_from_supabase(user_id: str) -> dict:
    """Fetch user's knowledge graph from Supabase."""
    if not supabase_client or not user_id:
        return {"nodes": [], "edges": []}
    
    try:
        # Fetch nodes
        nodes_result = supabase_client.table("graph_nodes").select("*").eq("user_id", user_id).execute()
        nodes = nodes_result.data if nodes_result.data else []
        
        # Fetch edges
        edges_result = supabase_client.table("graph_edges").select("*").eq("user_id", user_id).execute()
        edges = edges_result.data if edges_result.data else []
        
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        print(f"❌ Error fetching user graph: {e}")
        return {"nodes": [], "edges": []}


async def detect_weak_clusters(graph: dict) -> list:
    """Analyze graph to find weak clusters (low edge weights)."""
    weak_clusters = []
    edges = graph.get("edges", [])
    nodes = graph.get("nodes", [])
    
    # Group edges by context/cluster
    cluster_edges = {}
    for edge in edges:
        # Find source node context
        source_node = next((n for n in nodes if n.get("id") == edge.get("source_id")), None)
        if source_node:
            context = source_node.get("context", "General")
            if context not in cluster_edges:
                cluster_edges[context] = []
            cluster_edges[context].append(edge)
    
    # Find clusters with weak connections (avg weight < 0.5)
    for cluster, edges_list in cluster_edges.items():
        if not edges_list:
            continue
        
        avg_weight = sum(float(e.get("weight", 0)) for e in edges_list) / len(edges_list)
        if avg_weight < 0.5:
            weak_clusters.append({
                "cluster": cluster,
                "avg_weight": avg_weight,
                "edge_count": len(edges_list)
            })
    
    return weak_clusters


async def store_insight_to_supabase(user_id: str, insight_type: str, content: str, metadata: dict):
    """Store insight to Supabase insights table."""
    if not supabase_client or not user_id:
        return False
    
    try:
        data = {
            "id": str(uuid4()),
            "user_id": user_id,
            "insight_type": insight_type,
            "content": content,
            "metadata": metadata,
            "is_read": False,
            "is_dismissed": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase_client.table("insights").insert(data).execute()
        print(f"✅ Insight stored: {insight_type} for user {user_id[:8]}...")
        return True
    except Exception as e:
        print(f"❌ Error storing insight: {e}")
        return False


async def fetch_sentences_for_cluster(user_id: str, cluster: str) -> list:
    """Fetch user's captured sentences for a specific cluster/context."""
    if not supabase_client or not user_id:
        return []
    
    try:
        result = supabase_client.table("captured_sentences")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("context", cluster)\
            .limit(10)\
            .execute()
        
        return result.data if result.data else []
    except Exception as e:
        print(f"❌ Error fetching sentences for cluster: {e}")
        return []


def generate_quiz_with_asi(cluster: str, sentences: list, difficulty: int) -> list:
    """Generate quiz questions using ASI:One based on cluster and sentences."""
    try:
        # Prepare context from sentences
        sentences_text = "\n".join([s.get("sentence", "")[:100] for s in sentences[:5]])
        
        difficulty_map = {1: "beginner", 2: "intermediate", 3: "advanced"}
        difficulty_level = difficulty_map.get(difficulty, "intermediate")
        
        prompt = f"""Generate 3 multiple-choice quiz questions about {cluster} concepts at {difficulty_level} level.

Context sentences:
{sentences_text}

Respond with ONLY this JSON structure (no markdown, no explanation):
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "a",
      "explanation": "Why this answer is correct"
    }}
  ]
}}

Make questions relevant to {cluster} and appropriate for {difficulty_level} learners."""
        
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
                        "content": "You are a quiz generation assistant. Generate clear, educational multiple-choice questions. Always respond with valid JSON only."
                    },
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.8,
                "max_tokens": 800
            },
            timeout=30
        )
        
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        parsed = validate_and_parse_json(content, {"questions": []})
        return parsed.get("questions", [])
    except Exception as e:
        print(f"[ASI:One Quiz Generation Error]: {e}")
        return []


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
        
        # Add explanation to analysis for storage
        analysis["explanation"] = explanation
        
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

@agent.on_rest_post("/detect-gaps", GapDetectionRequest, GapDetectionResponse)
async def handle_detect_gaps(ctx: Context, req: GapDetectionRequest) -> GapDetectionResponse:
    """
    REST endpoint for proactive gap detection in user's knowledge graph.
    Identifies weak clusters and suggests areas to improve.
    """
    ctx.logger.info(f"🔍 Gap detection requested for user: {req.user_id[:8]}...")
    
    try:
        # Fetch user's graph from Supabase
        user_graph = await fetch_user_graph_from_supabase(req.user_id)
        
        if not user_graph.get("nodes"):
            return GapDetectionResponse(
                gaps=[],
                suggestions=["Start capturing more sentences to build your knowledge graph!"],
                timestamp=int(time.time())
            )
        
        # Detect weak clusters (edges with weight < 0.5)
        weak_clusters = await detect_weak_clusters(user_graph)
        
        # Use ASI:One asi1-graph to analyze gaps
        graph_json = json.dumps({
            "nodes_count": len(user_graph.get("nodes", [])),
            "edges_count": len(user_graph.get("edges", [])),
            "weak_clusters": weak_clusters,
            "user_xp": req.user_xp
        })
        
        prompt = f"""Analyze this Web3 knowledge graph for learning gaps.

Graph summary: {graph_json}

Respond with ONLY this JSON (no markdown):
{{
  "gaps": [
    {{
      "cluster": "DeFi",
      "missing_concepts": ["yield farming", "liquidity pools"],
      "confidence": 0.7
    }}
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}}

Focus on actionable gaps that would strengthen the weakest clusters."""
        
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
                        "content": "You are a knowledge graph analyst specializing in identifying learning gaps. Respond with valid JSON only."
                    },
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.7,
                "max_tokens": 500
            },
            timeout=30
        )
        
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        parsed = validate_and_parse_json(content, {"gaps": [], "suggestions": []})
        gaps = parsed.get("gaps", [])
        suggestions = parsed.get("suggestions", [])
        
        # Store insights to Supabase for each gap
        for gap in gaps:
            cluster = gap.get("cluster", "Unknown")
            missing = ", ".join(gap.get("missing_concepts", [])[:3])
            await store_insight_to_supabase(
                user_id=req.user_id,
                insight_type="gap_detected",
                content=f"Weak cluster: {cluster}. Missing concepts: {missing}",
                metadata={
                    "cluster": cluster,
                    "missing_concepts": gap.get("missing_concepts", []),
                    "confidence": gap.get("confidence", 0),
                    "suggestions": suggestions
                }
            )
        
        ctx.logger.info(f"✅ Detected {len(gaps)} gaps for user {req.user_id[:8]}")
        
        return GapDetectionResponse(
            gaps=gaps,
            suggestions=suggestions,
            timestamp=int(time.time())
        )
    except Exception as e:
        ctx.logger.error(f"❌ Error in gap detection: {e}")
        return GapDetectionResponse(
            gaps=[],
            suggestions=[f"Error detecting gaps: {str(e)}"],
            timestamp=int(time.time())
        )

@agent.on_rest_post("/generate-quiz", QuizGenerationRequest, QuizGenerationResponse)
async def handle_generate_quiz(ctx: Context, req: QuizGenerationRequest) -> QuizGenerationResponse:
    """
    REST endpoint for generating adaptive quizzes based on knowledge gaps.
    Uses ASI:One to create personalized questions.
    """
    ctx.logger.info(f"📝 Quiz generation requested: {req.gap_cluster} (difficulty {req.difficulty})")
    
    try:
        # Fetch sentences for this cluster
        sentences = await fetch_sentences_for_cluster(req.user_id, req.gap_cluster)
        
        if not sentences:
            # Fallback: generate generic questions
            ctx.logger.warning(f"No sentences found for cluster {req.gap_cluster}, generating generic quiz")
            sentences = [{"sentence": f"This is about {req.gap_cluster} concepts in Web3."}]
        
        # Generate quiz using ASI:One
        questions_raw = generate_quiz_with_asi(req.gap_cluster, sentences, req.difficulty)
        
        # Convert to QuizQuestion models
        questions = []
        for q in questions_raw:
            if isinstance(q, dict) and "question" in q:
                questions.append(q)
        
        if not questions:
            # Fallback quiz
            questions = [{
                "question": f"What is a key concept in {req.gap_cluster}?",
                "options": [
                    "Decentralization",
                    "Centralization",
                    "Traditional banking",
                    "None of the above"
                ],
                "correct": "a",
                "explanation": f"{req.gap_cluster} emphasizes decentralized systems."
            }]
        
        # Store quiz suggestion as insight
        await store_insight_to_supabase(
            user_id=req.user_id,
            insight_type="quiz_suggested",
            content=f"Quiz generated for {req.gap_cluster} cluster",
            metadata={
                "cluster": req.gap_cluster,
                "difficulty": req.difficulty,
                "question_count": len(questions)
            }
        )
        
        ctx.logger.info(f"✅ Generated {len(questions)} questions for {req.gap_cluster}")
        
        return QuizGenerationResponse(
            questions=questions,
            cluster=req.gap_cluster,
            difficulty=req.difficulty,
            timestamp=int(time.time())
        )
    except Exception as e:
        ctx.logger.error(f"❌ Error generating quiz: {e}")
        return QuizGenerationResponse(
            questions=[],
            cluster=req.gap_cluster,
            difficulty=req.difficulty,
            timestamp=int(time.time())
        )

def generate_badge_image_with_asi(domain: str, score: int, node_count: int, concepts: list, format: str) -> tuple[str, float]:
    """Use ASI:One image generation API to create badge images."""
    import time
    start_time = time.time()
    
    # Define prompt templates based on format
    prompt_templates = {
        "square": f"Professional achievement badge for {domain} mastery, featuring {', '.join(concepts[:3]) if concepts else 'knowledge symbols'}, modern minimalist design, gradient background, trophy icon, {score}% score display, high quality digital art, 1024x1024",
        "story": f"Vertical social media story showcasing {domain} knowledge badge, modern UI design, vibrant colors, {', '.join(concepts[:3]) if concepts else 'achievement'} icons, {score}% mastery celebration theme, 9:16 aspect ratio, 1080x1920",
        "certificate": f"Elegant certificate of achievement for {domain} expertise, formal design with ornate border, {', '.join(concepts[:2]) if concepts else 'professional'} symbols, professional typography, {score}% mastery indicator, landscape format, 2048x1536",
        "poster": f"Eye-catching promotional poster for {domain} mastery achievement, bold typography, {', '.join(concepts[:4]) if concepts else 'knowledge'} visualization, inspiring design, {score}% score prominent, suitable for sharing, 2048x1024",
        "banner": f"Wide banner celebrating {domain} expertise, {', '.join(concepts[:3]) if concepts else 'mastery'} highlights, professional design, {score}% achievement score, suitable for profile headers, 2048x512"
    }
    
    prompt = prompt_templates.get(format, prompt_templates["square"])
    
    try:
        # Call ASI:One image generation API
        ASI_IMAGE_API_URL = "https://api.asi1.ai/v1/image/generate"
        
        response = requests.post(
            ASI_IMAGE_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ASI_ONE_API_KEY}"
            },
            json={
                "prompt": prompt,
                "size": "1024x1024",  # Will be adjusted based on format requirements
                "model": "asi1-mini"
            },
            timeout=60
        )
        
        response.raise_for_status()
        result = response.json()
        
        # Extract image data
        if "images" in result and len(result["images"]) > 0:
            image_url = result["images"][0]["url"]
            
            # If image_url starts with data:image, it's already base64
            if image_url.startswith("data:image"):
                # Extract base64 data
                image_data = image_url.split(",", 1)[1]
            else:
                # If it's a URL, fetch the image and convert to base64
                img_response = requests.get(image_url, timeout=30)
                import base64
                image_data = base64.b64encode(img_response.content).decode('utf-8')
            
            generation_time = time.time() - start_time
            return image_data, generation_time
        else:
            raise ValueError("No images returned from ASI:One API")
            
    except Exception as e:
        print(f"[ASI:One Image Generation Error]: {e}")
        # Return error but don't fail - frontend will use fallback
        return f"Error: {str(e)}", time.time() - start_time


@agent.on_rest_post("/generate-badge-image", BadgeImageRequest, BadgeImageResponse)
async def handle_generate_badge_image(ctx: Context, req: BadgeImageRequest) -> BadgeImageResponse:
    """
    REST endpoint for generating badge images using ASI:One image generation.
    Creates unique AI-generated images based on domain, score, and user's captured concepts.
    """
    ctx.logger.info(f"🎨 Badge image generation requested: {req.domain} ({req.format})")
    
    try:
        start_time = time.time()
        
        # Generate image using ASI:One
        image_data, gen_time = generate_badge_image_with_asi(
            domain=req.domain,
            score=req.score,
            node_count=req.node_count,
            concepts=req.concepts,
            format=req.format
        )
        
        # Construct prompt used (same logic as in generate_badge_image_with_asi)
        concepts_str = ', '.join(req.concepts[:3]) if req.concepts else 'knowledge symbols'
        prompt_used = f"Professional achievement badge for {req.domain} mastery, featuring {concepts_str}, modern minimalist design, gradient background, {req.score}% score display, high quality digital art"
        
        ctx.logger.info(f"✅ Generated {req.format} badge image in {gen_time:.2f}s")
        
        return BadgeImageResponse(
            image_data=image_data,
            prompt_used=prompt_used,
            generation_time=gen_time,
            timestamp=int(time.time())
        )
    except Exception as e:
        ctx.logger.error(f"❌ Error generating badge image: {e}")
        return BadgeImageResponse(
            image_data=f"Error: {str(e)}",
            prompt_used=f"Error: {str(e)}",
            generation_time=0.0,
            timestamp=int(time.time())
        )

# ======= FUTURE: RAG IMPLEMENTATION =======
# TODO: Implement RAG after vector embeddings are populated
# async def rag_query(query: str, user_id: str) -> str:
#     """
#     Retrieval-Augmented Generation using vector similarity search.
#     
#     Flow:
#     1. Generate query embedding using OpenAI text-embedding-3-small
#     2. Search Supabase: SELECT * FROM captured_sentences 
#        WHERE user_id = ? ORDER BY embedding <-> query_embedding LIMIT 5
#     3. Pass retrieved sentences as context to ASI:One for augmented response
#     """
#     pass

print(f"🚀 Fluent Advanced Agent Starting...")
print(f"📧 Agent address: {agent.address}")
print(f"🌐 Available at: http://0.0.0.0:8010")
print(f"🔑 ASI:One API: {'✅ Set' if ASI_ONE_API_KEY else '❌ Not set'}")
print(f"🧠 MeTTa Knowledge Graph: Initialized")
print(f"📊 ASI:One Models: asi1-mini (extraction), asi1-graph (reasoning)")
print(f"🎯 REST Endpoints: /explain-sentence, /graph-analysis, /detect-gaps, /generate-quiz, /generate-badge-image")
print(f"💡 Proactive Nudges: Enabled (gap detection + quiz generation)")
print(f"🎨 AI Image Generation: Enabled (ASI:One integration)")

if __name__ == "__main__":
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Agent stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
