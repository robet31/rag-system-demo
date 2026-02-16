import { openai } from 'ai'
import { openai as openaiClient } from '@ai-sdk/openai'
import { LanceDBVectorStore } from '@lancedb/vectordb'
import fs from 'fs/promises'
import path from 'path'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'
const MODEL_NAME = 'z-ai/glm-4.5-air:free'

// Initialize OpenRouter client
const openrouter = openaiClient({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
})

// Simple in-memory vector store simulation
class SimpleVectorStore {
  private embeddings: Array<{ text: string; embedding: number[] }> = []
  private initialized = false

  async initialize() {
    if (this.initialized) return
    
    try {
      const knowledgePath = path.join(process.cwd(), 'knowledge_base.txt')
      const knowledgeText = await fs.readFile(knowledgePath, 'utf-8')
      
      // Split into chunks and create embeddings
      const chunks = this.chunkText(knowledgeText, 500)
      for (const chunk of chunks) {
        const embedding = await this.createEmbedding(chunk)
        this.embeddings.push({ text: chunk, embedding })
      }
      
      this.initialized = true
      console.log(`Initialized with ${this.embeddings.length} document chunks`)
    } catch (error) {
      console.error('Error initializing vector store:', error)
      throw error
    }
  }

  private chunkText(text: string, maxLength: number): string[] {
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

  private async createEmbedding(text: string): Promise<number[]> {
    // Simulate embedding - in production, use a proper embedding model
    // This is a simple hash-based simulation for demo purposes
    const hash = this.simpleHash(text)
    return Array.from({ length: 384 }, (_, i) => Math.sin(hash + i) * 0.1 + Math.random() * 0.1)
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  async similaritySearch(query: string, limit: number = 3): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize()
    }

    const queryEmbedding = await this.createEmbedding(query)
    
    const similarities = this.embeddings.map(({ text, embedding }) => ({
      text,
      similarity: this.cosineSimilarity(queryEmbedding, embedding)
    }))

    similarities.sort((a, b) => b.similarity - a.similarity)
    
    return similarities.slice(0, limit).map(item => item.text)
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    
    return dotProduct / (magnitudeA * magnitudeB)
  }
}

const vectorStore = new SimpleVectorStore()

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
    const relevantDocs = await vectorStore.similaritySearch(query, 3)
    
    // Create enhanced prompt with context
    const context = relevantDocs.join('\n\n')
    const enhancedPrompt = `Based on the following context about Retrieval-Augmented Generation (RAG), please answer the user's question accurately and comprehensively.

Context:
${context}

Question: ${query}

Please provide a detailed answer based only on the provided context. If the context doesn't contain enough information to answer the question, please say so.`

    // Generate response using OpenRouter
    const result = await openrouter.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that specializes in Retrieval-Augmented Generation (RAG). Provide accurate, detailed answers based on the provided context.'
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const answer = result.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

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