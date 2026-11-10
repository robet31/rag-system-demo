/**
 * Daily Tech Digest — Cron API Route
 *
 * Runs every day at 22:00 UTC (05:00 WIB) via Vercel Cron.
 * Fetches top tech / open-source articles from daily.dev (with a
 * Hacker News fallback) and sends a nicely-formatted summary to
 * a Telegram chat.
 *
 * Required environment variables:
 *   TELEGRAM_BOT_TOKEN  — bot token from @BotFather
 *   TELEGRAM_CHAT_ID    — target chat / user ID
 *   CRON_SECRET         — shared secret used to authorize the request
 */

import { NextRequest } from 'next/server'

// ── Types ────────────────────────────────────────────────────────────────────

interface Article {
  title: string
  url: string
  summary: string
  source: string
  tags: string[]
}

// ── daily.dev GraphQL API ─────────────────────────────────────────────────────

const DAILY_DEV_API = 'https://app.daily.dev/api/graphql'

const DAILY_DEV_QUERY = `
  query AnonymousFeed {
    anonymousFeed(first: 20, ranking: POPULARITY) {
      edges {
        node {
          id
          title
          permalink
          summary
          source { name }
          tags
        }
      }
    }
  }
`

/** Tags that are considered interesting for this digest. */
const OPEN_SOURCE_TAGS = new Set([
  'open-source',
  'opensource',
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'golang',
  'react',
  'nextjs',
  'ai',
  'machine-learning',
  'devops',
  'cloud',
  'security',
  'web-development',
  'programming',
  'software-engineering',
  'linux',
  'github',
])

async function fetchDailyDevArticles(): Promise<Article[]> {
  const response = await fetch(DAILY_DEV_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'RAG-System-Demo-Bot/1.0',
    },
    body: JSON.stringify({ query: DAILY_DEV_QUERY }),
  })

  if (!response.ok) {
    throw new Error(`daily.dev API returned ${response.status}`)
  }

  const data = await response.json()
  const edges: any[] = data?.data?.anonymousFeed?.edges ?? []

  return edges
    .map((edge: any) => ({
      title: edge.node.title ?? '',
      url: edge.node.permalink ?? '',
      summary: edge.node.summary ?? '',
      source: edge.node.source?.name ?? 'daily.dev',
      tags: (edge.node.tags ?? []) as string[],
    }))
    .filter(
      (a) =>
        a.title &&
        a.url &&
        a.tags.some((t: string) => OPEN_SOURCE_TAGS.has(t.toLowerCase())),
    )
}

// ── Hacker News fallback ─────────────────────────────────────────────────────

async function fetchHackerNewsArticles(): Promise<Article[]> {
  const idsRes = await fetch(
    'https://hacker-news.firebaseio.com/v0/topstories.json',
  )
  if (!idsRes.ok) throw new Error('HN top stories request failed')
  const ids: number[] = await idsRes.json()

  // Fetch the first 30 stories in parallel and pick the best ones
  const stories = await Promise.all(
    ids.slice(0, 30).map((id) =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
        (r) => r.json(),
      ),
    ),
  )

  const techKeywords = [
    'open source',
    'open-source',
    'typescript',
    'javascript',
    'python',
    'rust',
    'golang',
    'react',
    'next.js',
    'ai',
    'machine learning',
    'llm',
    'devops',
    'cloud',
    'linux',
    'github',
    'programming',
    'developer',
    'software',
    'api',
    'framework',
    'library',
  ]

  return stories
    .filter((s) => {
      if (!s || s.type !== 'story' || !s.url) return false
      const text = (s.title ?? '').toLowerCase()
      return techKeywords.some((kw) => text.includes(kw))
    })
    .slice(0, 10)
    .map((s) => ({
      title: s.title ?? '',
      url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
      summary: '',
      source: 'Hacker News',
      tags: [],
    }))
}

// ── Article fetching orchestration ──────────────────────────────────────────

async function getTopArticles(limit = 7): Promise<Article[]> {
  try {
    const articles = await fetchDailyDevArticles()
    if (articles.length > 0) return articles.slice(0, limit)
  } catch (err) {
    console.warn('[daily-digest] daily.dev fetch failed, trying HN:', err)
  }

  try {
    const articles = await fetchHackerNewsArticles()
    return articles.slice(0, limit)
  } catch (err) {
    console.error('[daily-digest] HN fallback also failed:', err)
    return []
  }
}

// ── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Telegram API error ${response.status}: ${body}`)
  }
}

// ── Message formatting ───────────────────────────────────────────────────────

function formatDigestMessage(articles: Article[]): string {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  })

  const lines: string[] = [
    `🚀 <b>Daily Tech Digest</b> — ${dateStr}`,
    `📡 Berita & artikel teknologi menarik hari ini:\n`,
  ]

  articles.forEach((article, i) => {
    const tagLine =
      article.tags.length > 0
        ? `  🏷 ${article.tags.slice(0, 3).join(', ')}\n`
        : ''

    const summaryLine =
      article.summary.trim().length > 0
        ? `  📝 ${escapeHtml(article.summary).slice(0, 120).trim()}${article.summary.length > 120 ? '…' : ''}\n`
        : ''

    lines.push(
      `${i + 1}. <b><a href="${article.url}">${escapeHtml(article.title)}</a></b>\n` +
        summaryLine +
        tagLine +
        `  🔗 <i>${escapeHtml(article.source)}</i>\n`,
    )
  })

  lines.push(
    `\n💡 Temukan lebih banyak di <a href="https://app.daily.dev">daily.dev</a>`,
    `\n⏰ Dikirim otomatis jam 05.00 WIB`,
  )

  return lines.join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<Response> {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── Env check ─────────────────────────────────────────────────────────────
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return Response.json(
      {
        error:
          'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables.',
      },
      { status: 500 },
    )
  }

  // ── Fetch articles ─────────────────────────────────────────────────────────
  const articles = await getTopArticles(7)

  if (articles.length === 0) {
    return Response.json(
      { error: 'No articles fetched from any source.' },
      { status: 500 },
    )
  }

  // ── Send to Telegram ───────────────────────────────────────────────────────
  try {
    const message = formatDigestMessage(articles)
    await sendTelegramMessage(botToken, chatId, message)
    return Response.json({
      success: true,
      articlesCount: articles.length,
      message: `Digest dengan ${articles.length} artikel berhasil dikirim ke Telegram.`,
    })
  } catch (err: any) {
    console.error('[daily-digest] Failed to send Telegram message:', err)
    return Response.json(
      { error: `Gagal mengirim ke Telegram: ${err.message}` },
      { status: 500 },
    )
  }
}
