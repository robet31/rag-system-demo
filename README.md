# RAG System Demo

A simple demonstration of a Retrieval-Augmented Generation (RAG) system built with Next.js, Shadcn/ui, Framer Motion, and OpenRouter API.

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

## Configuration

### OpenRouter API

The demo uses the `openrouter/free` model from OpenRouter which automatically selects a free model. You can change this in `app/api/rag/route.ts`:

```typescript
const MODEL_NAME = 'openrouter/free'
```

### Knowledge Base

The knowledge base is stored in `knowledge_base.txt`. You can modify this file to add more content or change the topic focus.

### Database Schema

The chat history is stored in Supabase. Run `supabase/schema.sql` to create the required tables:

```sql
-- Creates chat_history table with RLS policies
-- Each user can only see their own chat history
```

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