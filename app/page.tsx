'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthForm } from '@/components/auth/auth-form'
import { ChatPopup } from '@/components/chat/chat-popup'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import RagInterface from '@/components/rag-interface'
import { UnicornAnimation } from '@/components/unicorn-animation'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Bot, LogOut, User, Settings, ChevronDown, Sparkles, Zap, Shield, ArrowUp } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Home() {
  const { user, isAdmin, loading, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [currentView, setCurrentView] = useState<'chat' | 'admin'>('chat')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const ragSectionRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll()
  const navBg = useTransform(scrollYProgress, [0, 0.05], [0, 1])
  const [navOpacity, setNavOpacity] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'true') {
      setShowAuth(true)
    }
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const unsubscribe = navBg.on('change', (v) => setNavOpacity(v))
    return () => unsubscribe()
  }, [navBg])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToRag = () => {
    ragSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="bg-background min-h-screen">
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowAuth(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <AuthForm onClose={() => setShowAuth(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        className="fixed top-0 left-0 right-0 z-40 border-b transition-colors duration-300"
        style={{
          backgroundColor: `rgba(12, 15, 20, ${navOpacity * 0.85})`,
          backdropFilter: `blur(${navOpacity * 20}px)`,
          borderColor: `rgba(35, 43, 58, ${navOpacity * 0.5})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={scrollToTop}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">RAG Demo</span>
          </motion.div>
          <div className="flex items-center gap-2">
            {!loading && user && isAdmin && currentView === 'admin' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <Button onClick={() => setCurrentView('chat')} size="sm" className="bg-primary text-primary-foreground font-medium">
                  <Bot className="w-4 h-4 mr-1.5" />
                  Chat
                </Button>
              </motion.div>
            )}
            {!loading && user && isAdmin && currentView === 'chat' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <Button onClick={() => setCurrentView('admin')} size="sm" className="bg-secondary text-secondary-foreground font-medium">
                  <Settings className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
              </motion.div>
            )}
            {loading ? (
              <div className="w-20 h-8 bg-muted rounded-lg animate-pulse" />
            ) : user ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button onClick={signOut} variant="outline" size="sm" className="border-border/50 hover:bg-muted font-medium">
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Keluar
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button onClick={() => setShowAuth(true)} size="sm" className="bg-primary text-primary-foreground font-medium">
                  <User className="w-4 h-4 mr-1.5" />
                  Login
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.nav>

      {!loading && user && isAdmin && currentView === 'admin' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-20 pb-10"
        >
          <div className="max-w-5xl mx-auto px-6">
            <AdminDashboard />
          </div>
        </motion.div>
      ) : (
        <>
          <section ref={heroRef} className="min-h-screen pt-16 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              <UnicornAnimation height="100%" projectId="62M9dcB4C0nf8eYoVHME" />
            </div>
            <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0c0f14]/90 via-[#0c0f14]/70 to-[#0c0f14]/90" />
            <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/30 via-transparent to-black/30" />
            <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center">
              <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 backdrop-blur-sm"
                  >
                    <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Powered by AI
                  </motion.div>

                  <motion.h1
                    className="font-heading text-6xl md:text-8xl font-bold mb-6 text-white tracking-tight leading-[0.9]"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    RAG
                    <motion.span
                      className="block text-primary"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                      System
                    </motion.span>
                  </motion.h1>

                  <motion.p
                    className="text-lg md:text-xl text-white/60 mb-12 max-w-xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    Retrieval-Augmented Generation dengan AI yang cerdas dan kontekstual
                  </motion.p>

                  <motion.div
                    className="flex flex-col sm:flex-row gap-3 justify-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                  >
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        onClick={scrollToRag}
                        size="lg"
                        className="bg-primary text-primary-foreground text-base px-8 py-6 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Coba RAG Demo
                      </Button>
                    </motion.div>
                    {!loading && !user && (
                      <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          onClick={() => setShowAuth(true)}
                          variant="outline"
                          size="lg"
                          className="text-base px-8 py-6 border-white/10 text-white/80 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:text-white font-medium transition-all"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Login untuk Akses Penuh
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    <motion.button
                      onClick={scrollToRag}
                      className="text-white/30 hover:text-white/60 transition-colors"
                      animate={{ y: [0, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                      <ChevronDown className="w-7 h-7 mx-auto" />
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          <motion.section 
            className="h-32 relative z-10"
            style={{ backdropFilter: 'blur(20px)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
          </motion.section>

          <section className="py-28 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />
            <div className="relative max-w-6xl mx-auto px-6">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                custom={0}
                className="text-center mb-20"
              >
                <motion.span
                  className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-3"
                  variants={fadeUp}
                  custom={0}
                >
                  Fitur Unggulan
                </motion.span>
                <h2 className="font-heading text-3xl md:text-5xl font-bold mb-5 tracking-tight">Kenapa RAG?</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Menggabungkan kekuatan retrieval dan generasi AI untuk jawaban yang akurat
                </p>
              </motion.div>

              <motion.div
                className="grid md:grid-cols-3 gap-5"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
              >
                {[
                  { icon: Sparkles, title: 'Kontekstual', desc: 'Jawaban berdasarkan knowledge base yang relevan', color: 'text-primary', glow: 'group-hover:shadow-primary/10' },
                  { icon: Zap, title: 'Cepat & Akurat', desc: 'Respon cepat dengan informasi yang tepat sasaran', color: 'text-accent', glow: 'group-hover:shadow-accent/10' },
                  { icon: Shield, title: 'Terpercaya', desc: 'Sumber informasi yang dapat diverifikasi', color: 'text-chart-5', glow: 'group-hover:shadow-chart-5/10' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className={`group bg-card/50 border border-border/50 rounded-xl p-7 text-center backdrop-blur-sm hover:bg-card/80 hover:border-border hover:shadow-xl ${item.glow} transition-all duration-300 cursor-default`}
                  >
                    <motion.div
                      className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-5"
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <item.icon className={`w-7 h-7 ${item.color}`} />
                    </motion.div>
                    <h3 className="font-heading text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          <motion.section 
            className="h-24 relative z-10"
            style={{ backdropFilter: 'blur(15px)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/80" />
          </motion.section>

          <section ref={ragSectionRef} className="py-28 relative">
            <div className="max-w-5xl mx-auto px-6">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                custom={0}
                className="text-center mb-14"
              >
                <motion.span
                  className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-3"
                  variants={fadeUp}
                  custom={0}
                >
                  Live Demo
                </motion.span>
                <h2 className="font-heading text-3xl md:text-5xl font-bold mb-5 tracking-tight">Coba RAG Sekarang</h2>
                <p className="text-muted-foreground text-lg">
                  {!loading && user ? 'Chat tanpa batas dengan RAG Assistant' : 'Coba 2 chat gratis, lalu login untuk akses penuh'}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <RagInterface />
              </motion.div>
            </div>
          </section>

          <motion.section 
            className="h-20 relative z-10"
            style={{ backdropFilter: 'blur(10px)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-transparent" />
          </motion.section>

          <section className="relative">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10" />
            <UnicornAnimation height="500px" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
          </section>

          <footer className="py-10 border-t border-border/20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto px-6 text-center"
            >
              <p className="text-muted-foreground text-sm mb-3">RAG System Demo — Built with Next.js, Supabase & OpenRouter AI</p>
              <a 
                href="https://linkedin.com/in/arraffi-abqori-nur-azizi/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span>Made by</span>
                <span className="font-semibold text-primary">ravnxx</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </motion.div>
          </footer>
        </>
      )}

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-24 left-6 w-10 h-10 bg-card/80 border border-border/50 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors z-50 shadow-lg"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <ChatPopup />
    </div>
  )
}
