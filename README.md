# RAG System Demo

🚀 **Live Demo**: [https://ragsystemconcept.vercel.app/](https://ragsystemconcept.vercel.app/)

---

A simple demonstration of a Retrieval-Augmented Generation (RAG) system built with Next.js, Shadcn/ui, Framer Motion, and OpenRouter API.

## 📸 Demo Preview

![RAG System Demo](RAG-System-Demo.gif)

---

## Features

- **RAG Integration**: Combines retrieval-based and generation-based AI approaches
- **Modern UI**: Built with Shadcn/ui components and Tailwind CSS
- **Smooth Animations**: Powered by Framer Motion for interactive user experience
- **Real-time Chat**: Live conversation interface with typing indicators
- **Context-aware Responses**: Answers based on provided knowledge base
- **OpenRouter AI**: Uses OpenRouter API for intelligent responses
- **User Authentication**: Google and Email login via Supabase
- **Chat History**: Persistent chat history per user account
- **Security**: Input validation, SQL injection protection, rate limiting

## 📚 Documentation

### Cara Menggunakan RAG System

1. **Halaman Utama (Homepage)**
   - Ketika pengguna mengakses website, akan melihat halaman utama dengan animasi dan tombol "Coba RAG Demo"
   - Pengguna bisa langsung mencoba chat gratis 2x tanpa login

2. **Login/Register**
   - Klik tombol "Login" di pojok kanan atas
   - Pilih login dengan Google atau Email/Password
   - Setelah login, pengguna mendapat akses chat tanpa batas

3. **Chat dengan RAG**
   - Ketik pertanyaan di kolom chat
   - Sistem akan mencari konteks relevan dari knowledge base
   - AI akan menjawab berdasarkan konteks yang ditemukan

4. **Riwayat Chat**
   - Chat history akan tersimpan secara otomatis
   - Saat login kembali, riwayat chat sebelumnya akan muncul
   - Setiap user hanya bisa melihat chat history masing-masing

### Arsitektur Sistem

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Next.js    │────▶│  OpenRouter │
│  (User UI)  │     │  API Route  │     │     AI      │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │  Database   │
                    └─────────────┘
```

### Fitur Keamanan

- ✅ Input Validation - Semua input divalidasi sebelum diproses
- ✅ SQL Injection Protection - Menggunakan parameterized queries
- ✅ Row Level Security - User hanya bisa akses data sendiri
- ✅ Rate Limiting - Mencegah abuse pada API
- ✅ Session Management - Menggunakan Supabase Auth
- ✅ Environment Variables - API keys disimpan di server-side

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Animations**: Framer Motion
- **AI Provider**: OpenRouter API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenRouter API key (get one from [https://openrouter.ai/settings/keys](https://openrouter.ai/settings/keys))
- Supabase account (for database and authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/robet31/rag-system-demo.git
   cd rag-system-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your credentials:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_REDIRECT_URL=http://localhost:3000/auth/callback
   
   # OpenRouter API Configuration
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Start by asking questions about RAG (Retrieval-Augmented Generation)
2. The system will search its knowledge base for relevant information
3. OpenRouter AI will generate responses based on the retrieved context
4. Try the example questions provided in the interface

### Example Questions

- "What is RAG?"
- "How does RAG work?"
- "Benefits of RAG"
- "RAG use cases"
- "What are the key components of RAG?"

## Project Structure

```
rag-system-demo/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── rag/           # RAG API endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   └── rag-interface.tsx  # Main RAG interface
├── lib/                  # Utility functions
├── knowledge_base.txt    # Knowledge base content
└── package.json          # Dependencies and scripts
```

## API Reference

### RAG Endpoint

- **URL**: `/api/rag`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "query": "Your question about RAG"
  }
  ```
- **Response**:
  ```json
  {
    "answer": "Generated response based on retrieved context",
    "sources": 3,
    "context": "Relevant context snippet..."
  }
  ```

## Environment Variables

Create `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Redirect URL for OAuth
NEXT_PUBLIC_REDIRECT_URL=https://your-project.vercel.app/auth/callback

# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-v1-your-api-key
```

### Getting API Keys:

1. **Supabase**: Create project at [supabase.com](https://supabase.com)
2. **OpenRouter**: Get API key at [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)

The demo uses the `openrouter/free` model from OpenRouter which automatically selects a free model. You can change this in `app/api/rag/route.ts`:

```typescript
const MODEL_NAME = 'openrouter/free'
```

### Knowledge Base

The knowledge base is stored in `knowledge_base.txt`. You can modify this file to add more content or change the topic focus.

### Database Schema

The chat history is stored in Supabase. Run the following SQL in Supabase SQL Editor:

```sql
-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_message TEXT NOT NULL,
  context_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history" ON chat_history
  FOR DELETE USING (auth.uid() = user_id);
```

## Environment Variables

## Security Features

- **Input Validation**: All API inputs are validated for type and length
- **SQL Injection Protection**: Using Supabase parameterized queries
- **Row Level Security**: Database policies ensure users only access their own data
- **API Key Protection**: Server-side only environment variables
- **Rate Limiting**: In-memory rate limiting for API requests
- **Authentication**: Secure session management via Supabase Auth

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Limitations

- This is a demo implementation with a simulated vector store
- For production use, consider using proper vector databases like Pinecone, Chroma, or Weaviate
- The knowledge base is static and would need to be updated manually
- No advanced chunking or embedding optimization

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Next.js](https://nextjs.org/) for the React framework
- [Shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Framer Motion](https://www.framer.com/motion/) for animations
- [OpenRouter](https://openrouter.ai/) for the AI API
- [Tailwind CSS](https://tailwindcss.com/) for styling