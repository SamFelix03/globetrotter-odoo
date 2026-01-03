import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    // Supabase handles email verification automatically via the callback
    // This endpoint is just for checking verification status
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unable to verify email. Please try the link again.' },
        { status: 400 }
      )
    }

    if (user.email_confirmed_at) {
      return NextResponse.json(
        { message: 'Email verified successfully', verified: true },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { message: 'Email verification pending', verified: false },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

