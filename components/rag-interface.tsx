'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Send, User, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface ChatMessage {
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

const MAX_FREE_CHATS = 2
const RAG_CHAT_COUNT_KEY = 'rag_demo_home_chat_count'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function RAGInterface() {
  const { user, signInWithGoogle } = useAuth()
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatCount, setChatCount] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem(RAG_CHAT_COUNT_KEY)
      const count = stored ? parseInt(stored) : 0
      setChatCount(count)
      if (count >= MAX_FREE_CHATS) setLimitReached(true)
    } else {
      setLimitReached(false)
      setChatCount(0)
    }
  }, [user])

  // Remove auto-scroll on message add

  const remaining = user ? null : MAX_FREE_CHATS - chatCount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    if (!user && chatCount >= MAX_FREE_CHATS) {
      setLimitReached(true)
      return
    }

    const userMessage: ChatMessage = {
      type: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    setQuery('')

    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', query: userMessage.content }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      const aiMessage: ChatMessage = {
        type: 'ai',
        content: data.answer,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

      if (!user) {
        const newCount = chatCount + 1
        setChatCount(newCount)
        localStorage.setItem(RAG_CHAT_COUNT_KEY, newCount.toString())
        if (newCount >= MAX_FREE_CHATS) setLimitReached(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      const errorMessage: ChatMessage = {
        type: 'ai',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch {}
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl font-semibold text-center flex items-center justify-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          RAG Chat Interface
        </CardTitle>
        <p className="text-center text-muted-foreground text-sm">
          Tanyakan apapun tentang Retrieval-Augmented Generation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-96 overflow-y-auto space-y-3 p-4 bg-muted/30 border border-border/30 rounded-lg">
          <AnimatePresence>
            {messages.length === 0 && !limitReached ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-muted-foreground py-16"
              >
                <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm">Mulai percakapan tentang RAG...</p>
                <p className="text-xs mt-1 text-muted-foreground/60">Coba tanya: &quot;Apa itu RAG?&quot; atau &quot;Bagaimana RAG bekerja?&quot;</p>
              </motion.div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-xl ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground border border-border/50'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    <div className="text-[10px] opacity-50 mt-1.5">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {message.type === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {limitReached && !user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/50 border border-border/50 rounded-xl p-5 mt-2"
            >
              <div className="flex items-center gap-2 text-primary mb-2">
                <Lock className="w-5 h-5" />
                <span className="font-heading font-semibold">Batas Demo Tercapai</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Kamu sudah menggunakan {MAX_FREE_CHATS}x chat gratis. Login untuk melanjutkan tanpa batas.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 h-10 border-border/50 bg-muted/30"
                >
                  <GoogleIcon />
                  <span className="font-medium">Login dengan Google</span>
                </Button>
                <Button
                  onClick={() => { window.location.href = '/?auth=true' }}
                  className="w-full bg-primary text-primary-foreground font-medium"
                >
                  Login dengan Email
                </Button>
              </div>
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border border-border/50 px-4 py-3 rounded-xl">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={limitReached && !user ? 'Login untuk melanjutkan chat...' : 'Tanyakan tentang RAG...'}
            className="flex-1 bg-black border-border/50 text-white placeholder:text-gray-400"
            disabled={isLoading || (limitReached && !user)}
          />
          <Button
            type="submit"
            disabled={!query.trim() || isLoading || (limitReached && !user)}
            className="bg-primary text-primary-foreground px-5"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground/60">
            {user ? (
              <span className="text-primary">Chat tanpa batas</span>
            ) : (
              <span className={remaining === 0 ? 'text-destructive' : ''}>
                {remaining}/{MAX_FREE_CHATS} chat gratis tersisa
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {[
              'Apa itu RAG?',
              'Cara kerja RAG',
              'Manfaat RAG',
              'Use case RAG'
            ].map((example, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setQuery(example)}
                disabled={limitReached && !user}
                className="px-2.5 py-1 text-[11px] bg-muted/50 text-muted-foreground border border-border/30 rounded-full hover:bg-muted hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {example}
              </motion.button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
