import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = await createClient()

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

    const { data, error } = await supabase
      .from('saved_destinations')
      .select(`
        *,
        cities:city_id (
          city_id,
          city_name,
          country,
          region,
          cost_index,
          cover_image_url
        )
      `)
      .eq('user_id', userData.user_id)
      .order('saved_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ destinations: data || [] }, { status: 200 })
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

    const { city_id, notes, priority } = body

    if (!city_id) {
      return NextResponse.json(
        { error: 'City ID is required' },
        { status: 400 }
      )
    }

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

    const { data, error } = await supabase
      .from('saved_destinations')
      .insert({
        user_id: userData.user_id,
        city_id,
        notes: notes || null,
        priority: priority || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ destination: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

