import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')

    // Get user_id from users table
    const { data: userData } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', authUser.email)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let query = supabase
      .from('trips')
      .select(`
        *,
        users:user_id (
          user_id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('user_id', userData.user_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ trips: data || [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()

    const { trip_name, trip_description, start_date, end_date, cover_photo_url, total_budget, is_public } = body

    if (!trip_name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Trip name, start date, and end date are required' },
        { status: 400 }
      )
    }

    // Get user_id from users table
    const { data: userData } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', authUser.email)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate public URL slug if trip is public
    let public_url_slug = null
    if (is_public) {
      public_url_slug = `${trip_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    }

    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: userData.user_id,
        trip_name,
        trip_description: trip_description || null,
        start_date,
        end_date,
        cover_photo_url: cover_photo_url || null,
        total_budget: total_budget || null,
        is_public: is_public || false,
        public_url_slug,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ trip: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

