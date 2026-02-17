import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const MAX_FREE_CHATS = 2
const ADMIN_EMAILS = ['admin@ragdemo.com', 'sinaubersama89@gmail.com']

export async function POST(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    return NextResponse.json({ 
      allowed: true, 
      isLoggedIn: true,
      isAdmin: user.email ? ADMIN_EMAILS.includes(user.email) : false
    })
  }

  const chatCountCookie = cookieStore.get('chat_count')
  const chatCount = chatCountCookie ? parseInt(chatCountCookie.value) : 0

  if (chatCount >= MAX_FREE_CHATS) {
    return NextResponse.json({ 
      allowed: false, 
      isLoggedIn: false,
      message: 'Anda sudah mencoba 2x chat gratis. Silakan login untuk melanjutkan.' 
    })
  }

  const newCount = chatCount + 1
  
  return NextResponse.json({ 
    allowed: true, 
    isLoggedIn: false,
    chatCount: newCount,
    remainingChats: MAX_FREE_CHATS - newCount
  })
}

export async function PUT() {
  const cookieStore = await cookies()
  const chatCountCookie = cookieStore.get('chat_count')
  const chatCount = chatCountCookie ? parseInt(chatCountCookie.value) : 0
  
  const newCount = chatCount + 1
  
  return NextResponse.json({ chatCount: newCount })
}
