'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, FileText, Database, Upload, RefreshCw } from 'lucide-react'

type Document = {
  id: number
  content: string
  source: string
  created_at: string
}

export function AdminDashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [newContext, setNewContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' })
      })
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (err) {
      console.error('Error fetching documents:', err)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleAddContext = async () => {
    if (!newContext.trim()) return
    
    setLoading(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'upload', 
          context: newContext 
        })
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage(data.message)
        setNewContext('')
        fetchDocuments()
      } else {
        setMessage(data.error || 'Gagal menambahkan konteks')
      }
    } catch (err) {
      setMessage('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus konteks ini?')) return
    
    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage('Konteks dihapus')
        fetchDocuments()
      } else {
        setMessage(data.error || 'Gagal menghapus')
      }
    } catch (err) {
      setMessage('Terjadi kesalahan')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader className="bg-muted">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Tambah Konteks Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <textarea
            value={newContext}
            onChange={(e) => setNewContext(e.target.value)}
            placeholder="Masukkan konteks atau informasi yang ingin ditambahkan ke sistem RAG..."
            className="w-full h-32 p-3 border border-input rounded-lg resize-none bg-background"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleAddContext}
              disabled={loading || !newContext.trim()}
              className="bg-primary text-primary-foreground"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Tambah Konteks
            </Button>
          </div>
          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-sm ${message.includes('Berhasil') ? 'text-green-600' : 'text-destructive'}`}
            >
              {message}
            </motion.p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Konteks Tersimpan ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border border-border rounded-lg bg-muted/30"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm line-clamp-3">{doc.content}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {doc.source || 'manual'}
                      </span>
                      <span>{new Date(doc.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDelete(doc.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {documents.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Belum ada konteks tersimpan
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
