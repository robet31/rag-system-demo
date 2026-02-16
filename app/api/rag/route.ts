import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'
const MODEL_NAME = 'z-ai/glm-4.5-air:free'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkfpeynhguzmyjmsrtmf.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZnBleW5oZ3V6bXlqbXNydG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzE2NzEsImV4cCI6MjA4Njg0NzY3MX0.IEpV7KSeKRHmSufJp3V4E1KqnJ3_I2Ou3tcCCmx6vSM'

const supabase = createClient(supabaseUrl, supabaseKey)

// Create table if not exists
async function ensureTableExists() {
  try {
    // Try to create table using SQL
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE IF NOT EXISTS rag_documents (
        id SERIAL PRIMARY KEY,
        content TEXT UNIQUE NOT NULL,
        embedding JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    })
    
    if (error) {
      // If RPC fails, try direct table creation via alternative method
      console.log('Table creation note:', error.message)
    }
  } catch (e) {
    console.log('Table check completed')
  }
}

// Initialize table on module load
ensureTableExists()

// OpenRouter API call using fetch
async function callOpenRouter(prompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://rag-system-demo.vercel.app',
      'X-Title': 'RAG System Demo'
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that specializes in Retrieval-Augmented Generation (RAG). Provide accurate, detailed answers based on the provided context.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })
  })

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'
}

// Simple hash-based embedding (for demo purposes)
function createEmbedding(text: string): number[] {
  const hash = simpleHash(text)
  return Array.from({ length: 384 }, (_, i) => 
    Math.sin(hash + i * 0.1) * 0.3 + Math.cos(hash * 0.5 + i) * 0.2 + (Math.random() - 0.5) * 0.1
  )
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Cosine similarity calculation
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// Chunk text into smaller pieces
function chunkText(text: string, maxLength: number = 500): string[] {
  const sentences = text.split(/[.!?]+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    if (currentChunk.length + trimmed.length > maxLength) {
      if (currentChunk) chunks.push(currentChunk)
      currentChunk = trimmed
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmed
    }
  }

  if (currentChunk) chunks.push(currentChunk)
  return chunks
}

// Initialize database table
async function initializeDatabase() {
  try {
    // Create table if not exists
    const { error } = await supabase.from('rag_documents').select('id').limit(1)
    
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('Creating rag_documents table...')
      
      // Create table using SQL
      const { error: createError } = await supabase.rpc('create_rag_table', {})
      
      if (createError) {
        console.log('Table creation skipped - will use alternative approach')
      }
    }
  } catch (error) {
    console.log('Database init error (expected if table not created):', error)
  }
}

// Get all documents from Supabase
async function getDocuments(): Promise<Array<{ id: number; content: string; embedding: number[] }>> {
  try {
    const { data, error } = await supabase
      .from('rag_documents')
      .select('id, content, embedding')
    
    if (error) {
      console.log('Error fetching documents, using local fallback:', error.message)
      return []
    }
    
    return data?.map(doc => ({
      id: doc.id,
      content: doc.content,
      embedding: typeof doc.embedding === 'string' ? JSON.parse(doc.embedding) : doc.embedding
    })) || []
  } catch (error) {
    console.log('Error getting documents:', error)
    return []
  }
}

// Save documents to Supabase
async function saveDocuments(chunks: string[]) {
  try {
    const documents = chunks.map(chunk => ({
      content: chunk,
      embedding: createEmbedding(chunk)
    }))

    // Insert documents (upsert to avoid duplicates)
    for (const doc of documents) {
      const { error } = await supabase
        .from('rag_documents')
        .upsert({
          content: doc.content,
          embedding: JSON.stringify(doc.embedding),
          created_at: new Date().toISOString()
        }, { onConflict: 'content' })
      
      if (error) {
        console.log('Error saving document:', error.message)
      }
    }
    
    console.log(`Saved ${documents.length} documents to Supabase`)
  } catch (error) {
    console.log('Error saving to Supabase:', error)
  }
}

// Initialize and load knowledge base
async function initializeKnowledgeBase() {
  try {
    const knowledgePath = path.join(process.cwd(), 'knowledge_base.txt')
    const knowledgeText = await fs.readFile(knowledgePath, 'utf-8')
    const chunks = chunkText(knowledgeText, 500)
    
    // Save to Supabase
    await saveDocuments(chunks)
    
    return chunks
  } catch (error) {
    console.error('Error initializing knowledge base:', error)
    return []
  }
}

// Similarity search
async function similaritySearch(query: string, limit: number = 3): Promise<string[]> {
  const queryEmbedding = createEmbedding(query)
  
  // Get all documents from Supabase
  const documents = await getDocuments()
  
  // If no documents in DB, use local knowledge base
  if (documents.length === 0) {
    console.log('No documents in database, using local knowledge base')
    const chunks = await initializeKnowledgeBase()
    return chunks.slice(0, limit)
  }
  
  // Calculate similarity
  const similarities = documents.map(doc => ({
    content: doc.content,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
  }))
  
  // Sort by similarity
  similarities.sort((a, b) => b.similarity - a.similarity)
  
  return similarities.slice(0, limit).map(item => item.content)
}

// Initialize on startup
initializeKnowledgeBase()

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    // Search for relevant documents
    const relevantDocs = await similaritySearch(query, 3)
    
    // Create enhanced prompt with context
    const context = relevantDocs.join('\n\n')
    const enhancedPrompt = `Based on the following context about Retrieval-Augmented Generation (RAG), please answer the user's question accurately and comprehensively.

Context:
${context}

Question: ${query}

Please provide a detailed answer based only on the provided context. If the context doesn't contain enough information to answer the question, please say so.`

    // Generate response using OpenRouter
    const answer = await callOpenRouter(enhancedPrompt)

    return Response.json({
      answer,
      sources: relevantDocs.length,
      context: relevantDocs[0]?.substring(0, 200) + '...' || 'No context found'
    })

  } catch (error) {
    console.error('RAG API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}