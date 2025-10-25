import os
import json
from uuid import uuid4
from datetime import datetime

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatMessage,
    ChatAcknowledgement,
    StartSessionContent,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

import google.generativeai as genai
from hyperon import MeTTa
from dotenv import load_dotenv

load_dotenv()

# ======= CONFIG =======
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set. Add it to your .env file.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

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

def extract_concepts_llm(text: str):
    """Use Gemini to extract Web3 concepts, terms, and relationships."""
    prompt = (
        "Extract all key Web3 concepts/terms, context, and relationships from the following input. "
        "Respond strictly in JSON format: "
        '{"terms": [string], "context": string, "relations": [[string, string, string]]}. '
        "Focus on Web3, blockchain, DeFi, NFTs, smart contracts, etc. "
        f"Input: {text}"
    )
    
    try:
        response = model.generate_content(prompt)
        print(f"[Gemini Output]: {response.text}")
        
        json_start = response.text.find("{")
        json_end = response.text.rfind("}") + 1
        if json_start == -1 or json_end == 0:
            raise ValueError("No JSON in response")
        
        json_str = response.text[json_start:json_end]
        return json.loads(json_str)
    except Exception as e:
        print(f"[Gemini Error]: {e}")
        return {"terms": [], "context": "", "relations": []}


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
            
            # 3. Normal chat: LLM + Auto-add to MeTTa
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
    mailbox=True,
    publish_agent_details=True,
    readme_path="README.md"
)

agent.include(chat_proto, publish_manifest=True)

print(f"🚀 Fluent Advanced Agent Starting...")
print(f"📧 Agent address: {agent.address}")
print(f"🌐 Available at: http://0.0.0.0:8010")
print(f"🔑 Gemini API: {'✅ Set' if GEMINI_API_KEY else '❌ Not set'}")
print(f"🧠 MeTTa Knowledge Graph: Initialized")

if __name__ == "__main__":
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Agent stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
