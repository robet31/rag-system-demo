import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const ADMIN_EMAILS = ['admin@ragdemo.com', 'sinaubersama89@gmail.com']

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const CACHE = new Map<string, { answer: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000
const REQUEST_COUNTS = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_PER_MINUTE = 15
const RATE_LIMIT_PER_DAY = 45

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function getUserFromCookies() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) return null
    return user
  } catch {
    return null
  }
}

async function callOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    return 'Error: OPENROUTER_API_KEY tidak ditemukan.'
  }
  
  const cacheKey = prompt.trim().toLowerCase()
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.answer
  }

  const now = Date.now()
  let requestCount = REQUEST_COUNTS.get('minute')
  if (!requestCount || now > requestCount.resetTime) {
    requestCount = { count: 0, resetTime: now + 60000 }
    REQUEST_COUNTS.set('minute', requestCount)
  }
  
  let dailyCount = REQUEST_COUNTS.get('day')
  if (!dailyCount || now > dailyCount.resetTime) {
    dailyCount = { count: 0, resetTime: now + 24 * 60 * 60 * 1000 }
    REQUEST_COUNTS.set('day', dailyCount)
  }
  
  if (requestCount.count >= RATE_LIMIT_PER_MINUTE) {
    return 'Terlalu banyak permintaan. Silakan tunggu sebentar.'
  }
  
  if (dailyCount.count >= RATE_LIMIT_PER_DAY) {
    return 'Batas harian tercapai. Silakan coba lagi besok.'
  }
  
  requestCount.count++
  dailyCount.count++
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://rag-system-demo.vercel.app',
        'X-Title': 'RAG System Demo'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah asisten RAG demo yang HANYA menjawab berdasarkan konteks yang diberikan. Jika pertanyaan di luar konteks knowledge base, beritahu user dengan sopan bahwa pertanyaan di luar cakupan. Jawab singkat dan jelas dalam bahasa Indonesia.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    const data = await response.json()
    
    if (data.error) {
      console.log('OpenRouter error:', data.error.message)
      return `Maaf, terjadi kesalahan: ${data.error.message}`
    }
    
    const content = data.choices?.[0]?.message?.content
    const reasoning = data.choices?.[0]?.message?.reasoning
    const answer = content || reasoning
    
    if (answer) {
      CACHE.set(cacheKey, { answer, timestamp: Date.now() })
      return answer
    }
    
    return 'Maaf, tidak dapat mendapatkan respons dari AI.'
  } catch (error: any) {
    console.log('OpenRouter error:', error.message)
    if (error.name === 'AbortError') {
      return 'Waktu habis. Silakan coba lagi.'
    }
    return `Terjadi kesalahan: ${error.message}`
  }
}

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

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

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

async function getDocuments(): Promise<Array<{ id: number; content: string; embedding: number[] }>> {
  try {
    const { data, error } = await supabase
      .from('rag_documents')
      .select('id, content, embedding')
    
    if (error) {
      console.log('Error fetching documents:', error.message)
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

async function saveDocuments(chunks: string[], source: string = 'manual') {
  try {
    for (const chunk of chunks) {
      const { error } = await supabase
        .from('rag_documents')
        .upsert({
          content: chunk,
          embedding: JSON.stringify(createEmbedding(chunk)),
          source: source,
          created_at: new Date().toISOString()
        }, { onConflict: 'content' })
      
      if (error) {
        console.log('Error saving document:', error.message)
      }
    }
    return true
  } catch (error) {
    console.log('Error saving to Supabase:', error)
    return false
  }
}

async function similaritySearch(query: string, limit: number = 3): Promise<string[]> {
  const queryEmbedding = createEmbedding(query)
  const documents = await getDocuments()
  
  if (documents.length === 0) {
    try {
      const knowledgePath = path.join(process.cwd(), 'knowledge_base.txt')
      const knowledgeText = await fs.readFile(knowledgePath, 'utf-8')
      const chunks = chunkText(knowledgeText, 500)
      await saveDocuments(chunks, 'knowledge_base')
      return chunks.slice(0, limit)
    } catch {
      return []
    }
  }
  
  const similarities = documents.map(doc => ({
    content: doc.content,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
  }))
  
  similarities.sort((a, b) => b.similarity - a.similarity)
  return similarities.slice(0, limit).map(item => item.content)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, query, context, fileContent } = body
    
    const user = await getUserFromCookies()
    const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false

    if (action === 'upload') {
      if (!isAdmin) {
        return Response.json({ error: 'Unauthorized. Only admin can upload context.' }, { status: 403 })
      }
      
      if (!context && !fileContent) {
        return Response.json({ error: 'Context or file content required' }, { status: 400 })
      }
      
      const content = context || fileContent
      const chunks = chunkText(content, 500)
      const success = await saveDocuments(chunks, 'admin_upload')
      
      if (success) {
        return Response.json({ 
          success: true, 
          message: `Berhasil menyimpan ${chunks.length} konteks` 
        })
      }
      return Response.json({ error: 'Gagal menyimpan konteks' }, { status: 500 })
    }

    if (action === 'delete') {
      if (!isAdmin) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 })
      }
      
      const { id } = body
      if (!id) {
        return Response.json({ error: 'Document ID required' }, { status: 400 })
      }
      
      const { error } = await supabase
        .from('rag_documents')
        .delete()
        .eq('id', id)
      
      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }
      
      return Response.json({ success: true, message: 'Konteks dihapus' })
    }

    if (action === 'list') {
      const documents = await getDocuments()
      return Response.json({ documents })
    }

    if (action === 'chat') {
      if (!query) {
        return Response.json({ error: 'Query required' }, { status: 400 })
      }

      const relevantDocs = await similaritySearch(query, 3)
      const context = relevantDocs.join('\n\n')
      const enhancedPrompt = `Kamu adalah asisten RAG (Retrieval-Augmented Generation) demo. Tugasmu HANYA menjawab pertanyaan berdasarkan konteks yang diberikan di bawah ini.

ATURAN KETAT:
1. HANYA jawab berdasarkan informasi dari konteks di bawah. Jangan mengarang atau menambahkan informasi di luar konteks.
2. Jika pertanyaan user TIDAK berkaitan dengan konteks (misalnya bertanya tentang cuaca, resep masakan, coding, dll), jawab dengan sopan:
   "Pertanyaan ini di luar cakupan knowledge base saya. Saya hanya bisa menjawab seputar topik RAG (Retrieval-Augmented Generation). Silakan tanyakan tentang apa itu RAG, cara kerja RAG, manfaat RAG, atau topik terkait lainnya."
3. Jawab dalam bahasa Indonesia, singkat dan jelas.
4. Jika konteks relevan ditemukan, jawab berdasarkan konteks tersebut.

KONTEKS DARI KNOWLEDGE BASE:
${context}

PERTANYAAN USER: ${query}`

      const answer = await callOpenRouter(enhancedPrompt)

      return Response.json({
        answer,
        sources: relevantDocs.length,
        context: relevantDocs[0]?.substring(0, 200) + '...' || 'No context'
      })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('RAG API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
