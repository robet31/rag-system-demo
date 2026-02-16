import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RAG System Demo',
  description: 'A simple RAG system demo using Next.js and OpenRouter',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}