import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user already exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 400 }
      )
    }

    // Sign up with Supabase Auth (this will send verification email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback?type=signup`,
      },
    })

    if (authError) {
      // Check if it's a user already exists error
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      )
    }

    // If auth user was created, create corresponding user record
    if (authData.user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          email,
          full_name: full_name || null,
        })

      if (dbError) {
        // If user creation fails, we should clean up the auth user
        // But Supabase doesn't allow deleting auth users easily, so we'll just log it
        console.error('Error creating user record:', dbError)
        return NextResponse.json(
          { error: 'Account created but user record failed. Please contact support.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        message: 'Account created successfully! Please check your email to verify your account.',
        requiresVerification: true
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
