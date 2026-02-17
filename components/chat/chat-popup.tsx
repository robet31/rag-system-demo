'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

const MAX_FREE_CHATS = 2
const CHAT_COUNT_KEY = 'rag_demo_chat_count'

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

export function ChatPopup() {
  const { user, signInWithGoogle } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatCount, setChatCount] = useState(0)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem(CHAT_COUNT_KEY)
      const count = stored ? parseInt(stored) : 0
      setChatCount(count)
      if (count >= MAX_FREE_CHATS) {
        setShowAuthPrompt(true)
      }
      setMessages([])
    } else {
      setShowAuthPrompt(false)
      loadChatHistory()
    }
  }, [user])

  const loadChatHistory = async () => {
    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_history' })
      })
      
      const data = await res.json()
      
      if (data.history && Array.isArray(data.history)) {
        const historyMessages: Message[] = data.history.map((item: any) => [
          {
            id: `user-${item.id}`,
            role: 'user' as const,
            content: item.user_message,
            timestamp: new Date(item.created_at)
          },
          {
            id: `ai-${item.id}`,
            role: 'assistant' as const,
            content: item.ai_message,
            timestamp: new Date(new Date(item.created_at).getTime() + 1)
          }
        ]).flat()
        
        setMessages(historyMessages)
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    if (!user) {
      const currentCount = parseInt(localStorage.getItem(CHAT_COUNT_KEY) || '0')
      if (currentCount >= MAX_FREE_CHATS) {
        setShowAuthPrompt(true)
        return
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          query: userMessage.content
        })
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer
      }

      setMessages(prev => [...prev, assistantMessage])

      if (!user) {
        const newCount = chatCount + 1
        setChatCount(newCount)
        localStorage.setItem(CHAT_COUNT_KEY, newCount.toString())
        if (newCount >= MAX_FREE_CHATS) {
          setShowAuthPrompt(true)
        }
      }
    } catch (err) {
      setError('Gagal mengirim pesan')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch {}
  }

  const remaining = user ? 'Unlimited' : `${Math.max(0, MAX_FREE_CHATS - chatCount)}/${MAX_FREE_CHATS}`

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg z-50 hover:bg-primary/90 transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-card border border-border rounded-lg shadow-xl flex flex-col z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-semibold">RAG Assistant</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !showAuthPrompt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground mt-8"
                >
                  <Bot className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Halo! Saya asisten RAG Anda.</p>
                  <p className="text-sm mt-1">Tanyakan apapun tentang sistem ini.</p>
                </motion.div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <Bot className="w-6 h-6 text-primary shrink-0" />
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <User className="w-6 h-6 text-primary shrink-0" />
                  )}
                </motion.div>
              ))}

              {showAuthPrompt && !user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted p-4 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Batas Demo Tercapai</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Anda sudah mencoba {MAX_FREE_CHATS}x chat gratis. Login untuk melanjutkan tanpa batas.
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={handleGoogleLogin}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 h-10"
                    >
                      <GoogleIcon />
                      <span>Login dengan Google</span>
                    </Button>
                    <Button
                      onClick={() => {
                        window.location.href = '/?auth=true'
                      }}
                      className="w-full bg-primary text-primary-foreground"
                    >
                      Login dengan Email
                    </Button>
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2"
                >
                  <Bot className="w-6 h-6 text-primary" />
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={showAuthPrompt && !user ? 'Login untuk melanjutkan...' : 'Ketik pesan...'}
                  disabled={loading || (showAuthPrompt && !user)}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim() || (showAuthPrompt && !user)}
                  size="icon"
                  className="bg-primary text-primary-foreground"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-center mt-2 text-muted-foreground">
                {user ? 'Chat tanpa batas' : `${remaining} chat gratis tersisa`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
