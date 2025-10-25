# Vector RAG Implementation TODO

This document outlines the future implementation plan for Retrieval-Augmented Generation (RAG) using vector embeddings in Fluent.

## Current Status

✅ **Schema Prepared**: The `captured_sentences` table has an `embedding vector(1536)` column ready for use.  
✅ **pgvector Extension**: Enabled in Supabase for vector similarity search.  
❌ **Not Yet Implemented**: Embedding generation and similarity search are not yet active.

---

## Implementation Plan

### Phase 1: Embedding Generation

#### 1.1 Choose Embedding Provider

**Options:**
- **OpenAI `text-embedding-3-small`** (Recommended)
  - 1536 dimensions
  - Cost: $0.00002 per 1K tokens
  - High quality embeddings
- **Cohere Embed v3**
  - 1024 dimensions (requires schema change to `vector(1024)`)
  - Good multilingual support
- **Open Source (Sentence Transformers)**
  - Self-hosted option
  - Free but requires compute resources

**Recommendation**: Start with OpenAI `text-embedding-3-small` for quality and ease of use.

#### 1.2 Create Supabase Edge Function

**File**: `supabase/functions/generate-embedding/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { sentence_id, sentence_text } = await req.json()
    
    // Call OpenAI Embeddings API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: sentence_text,
      }),
    })
    
    const data = await response.json()
    const embedding = data.data[0].embedding
    
    // Update Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    await supabase
      .from('captured_sentences')
      .update({ embedding })
      .eq('id', sentence_id)
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Deploy:**
```bash
supabase functions deploy generate-embedding --no-verify-jwt
```

#### 1.3 Create Database Trigger

Automatically generate embeddings when new sentences are inserted:

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_generate_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function via HTTP
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-embedding',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'sentence_id', NEW.id,
      'sentence_text', NEW.sentence
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to captured_sentences
CREATE TRIGGER on_sentence_insert_generate_embedding
  AFTER INSERT ON captured_sentences
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_embedding();
```

---

### Phase 2: Similarity Search

#### 2.1 Add Search Function to Agent

**File**: `agent/mailbox_agent.py`

```python
async def search_similar_sentences(query: str, user_id: str, limit: int = 5) -> list:
    """
    Search for similar sentences using vector similarity.
    
    Args:
        query: Search query text
        user_id: User ID to filter results
        limit: Number of results to return
    
    Returns:
        List of similar sentences with similarity scores
    """
    if not supabase_client or not user_id:
        return []
    
    try:
        # Generate embedding for query
        response = requests.post(
            'https://api.openai.com/v1/embeddings',
            headers={
                'Authorization': f'Bearer {os.environ.get("OPENAI_API_KEY")}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'text-embedding-3-small',
                'input': query
            }
        )
        
        query_embedding = response.json()['data'][0]['embedding']
        
        # Search Supabase using pgvector cosine similarity
        result = supabase_client.rpc(
            'search_sentences',
            {
                'query_embedding': query_embedding,
                'match_threshold': 0.6,
                'match_count': limit,
                'user_id_filter': user_id
            }
        ).execute()
        
        return result.data if result.data else []
    except Exception as e:
        print(f"❌ Vector search error: {e}")
        return []
```

#### 2.2 Create Supabase RPC Function

```sql
CREATE OR REPLACE FUNCTION search_sentences(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_filter uuid
)
RETURNS TABLE (
  id uuid,
  sentence text,
  terms text[],
  context text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    captured_sentences.id,
    captured_sentences.sentence,
    captured_sentences.terms,
    captured_sentences.context,
    1 - (captured_sentences.embedding <=> query_embedding) AS similarity
  FROM captured_sentences
  WHERE 
    captured_sentences.user_id = user_id_filter
    AND captured_sentences.embedding IS NOT NULL
    AND 1 - (captured_sentences.embedding <=> query_embedding) > match_threshold
  ORDER BY captured_sentences.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

### Phase 3: RAG Integration

#### 3.1 Add RAG Query Endpoint

**File**: `agent/mailbox_agent.py`

```python
@agent.on_rest_post("/rag-query", RAGQueryRequest, RAGQueryResponse)
async def handle_rag_query(ctx: Context, req: RAGQueryRequest) -> RAGQueryResponse:
    """
    Answer user query using RAG (Retrieval-Augmented Generation).
    Retrieves similar sentences and passes to ASI:One for contextualized response.
    """
    ctx.logger.info(f"🔍 RAG query: {req.query[:50]}...")
    
    try:
        # Step 1: Search for similar sentences
        similar_sentences = await search_similar_sentences(
            req.query, 
            req.user_id, 
            limit=5
        )
        
        if not similar_sentences:
            return RAGQueryResponse(
                answer="No relevant information found in your knowledge graph.",
                sources=[],
                timestamp=int(time.time())
            )
        
        # Step 2: Prepare context for ASI:One
        context = "\n\n".join([
            f"- {s['sentence']} (similarity: {s['similarity']:.2f})"
            for s in similar_sentences
        ])
        
        # Step 3: Query ASI:One with context
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
                        "content": "You are a helpful assistant. Answer based on the provided context from the user's knowledge graph."
                    },
                    {
                        "role": "user",
                        "content": f"Context:\n{context}\n\nQuestion: {req.query}"
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 300
            }
        )
        
        answer = response.json()['choices'][0]['message']['content']
        
        return RAGQueryResponse(
            answer=answer,
            sources=[s['sentence'] for s in similar_sentences],
            timestamp=int(time.time())
        )
    except Exception as e:
        ctx.logger.error(f"❌ RAG query error: {e}")
        return RAGQueryResponse(
            answer=f"Error: {str(e)}",
            sources=[],
            timestamp=int(time.time())
        )
```

---

## Cost Estimation

### OpenAI Embeddings
- **Cost per sentence**: ~$0.000004 (assuming 200 tokens average)
- **1000 sentences**: ~$0.004 (less than 1 cent)
- **10,000 sentences**: ~$0.04 (4 cents)

### Storage
- **pgvector storage**: 1536 dimensions × 4 bytes = 6KB per embedding
- **1000 sentences**: ~6MB
- **10,000 sentences**: ~60MB

**Conclusion**: Very cost-effective even at scale.

---

## Testing Plan

### 1. Test Embedding Generation
```bash
curl -X POST http://localhost:8010/test-embedding \
  -H "Content-Type: application/json" \
  -d '{"sentence": "Ethereum uses proof-of-stake consensus"}'
```

### 2. Test Similarity Search
```sql
SELECT 
  sentence,
  1 - (embedding <=> '[0.1, 0.2, ...]') AS similarity
FROM captured_sentences
WHERE user_id = 'test-user-id'
ORDER BY similarity DESC
LIMIT 5;
```

### 3. Test RAG Query
```bash
curl -X POST http://localhost:8010/rag-query \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "query": "What is proof-of-stake?"
  }'
```

---

## Performance Optimization

### 1. Index for Fast Similarity Search

```sql
-- Create HNSW index for fast approximate nearest neighbor search
CREATE INDEX ON captured_sentences 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Benefits**:
- 10-100x faster search
- Slight tradeoff in accuracy (still >95% recall)

### 2. Batch Embedding Generation

Process multiple sentences at once to reduce API calls:

```python
async def generate_embeddings_batch(sentences: list) -> list:
    """Generate embeddings for multiple sentences in one API call."""
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=[s['sentence'] for s in sentences]
    )
    
    return [item.embedding for item in response.data]
```

---

## Integration with Existing Features

### 1. Graph Viewer Chat (Website)
- Use RAG to answer questions about user's graph
- Display sources inline with answers
- Example: "What have I learned about DeFi?" → RAG searches and summarizes

### 2. Enhanced Quiz Generation
- Use similar sentences to generate more contextual quiz questions
- Example: Find user's notes on "staking" and generate questions based on their specific learning

### 3. Personalized Recommendations
- Find gaps by comparing user's embeddings to common concept embeddings
- Suggest related topics based on semantic similarity

---

## Migration Path

### Step 1: Backfill Existing Sentences
```python
# Script to generate embeddings for existing sentences
async def backfill_embeddings():
    sentences = supabase_client.table("captured_sentences")\
        .select("*")\
        .is_("embedding", "null")\
        .limit(100)\
        .execute()
    
    for sentence in sentences.data:
        await generate_embedding(sentence['id'], sentence['sentence'])
```

### Step 2: Gradual Rollout
1. **Week 1**: Enable for new sentences only
2. **Week 2**: Backfill 50% of existing sentences
3. **Week 3**: Complete backfill
4. **Week 4**: Enable RAG features in UI

---

## Resources

- **pgvector Docs**: https://github.com/pgvector/pgvector
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings
- **Supabase Vector Guide**: https://supabase.com/docs/guides/ai/vector-columns
- **RAG Tutorial**: https://www.pinecone.io/learn/retrieval-augmented-generation/

---

## Questions to Consider

1. **Privacy**: Should embeddings be stored locally or in cloud?
2. **Caching**: Cache query embeddings to reduce API calls?
3. **Multi-language**: Support non-English content with multilingual embeddings?
4. **Real-time**: Generate embeddings synchronously or async (current)?

---

**Status**: Ready to implement when needed  
**Estimated Effort**: 2-3 days for full implementation  
**Priority**: Medium (enhance existing features first)

