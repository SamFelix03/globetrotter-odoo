import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to login with error message
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'verification_link_invalid')
      return NextResponse.redirect(loginUrl)
    }

    if (data?.user) {
      // Check if this is an email verification
      if (data.user.email_confirmed_at || type === 'signup') {
        // Redirect to verify-email page to show success message
        return NextResponse.redirect(new URL('/verify-email?verified=true', requestUrl.origin))
      }
      
      // For password reset or other flows
      if (type === 'recovery') {
        const resetUrl = new URL('/reset-password', requestUrl.origin)
        resetUrl.searchParams.set('from_callback', 'true')
        return NextResponse.redirect(resetUrl)
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // If there's an error or no code, redirect to login
  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('error', 'verification_link_invalid')
  return NextResponse.redirect(loginUrl)
}

