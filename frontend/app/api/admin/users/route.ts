import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// Get all users
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

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('email', authUser.email)
      .single()

    if (!user?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get search and pagination params
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('users')
      .select('user_id, email, full_name, profile_photo_url, language_preference, created_at, updated_at, is_active, is_admin', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Apply pagination
    const { data: users, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = await createClient()

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('email', authUser.email)
      .single()

    if (!adminUser?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { user_id, ...updates } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Don't allow updating email or user_id
    const allowedUpdates: any = {}
    if (updates.full_name !== undefined) allowedUpdates.full_name = updates.full_name
    if (updates.is_active !== undefined) allowedUpdates.is_active = updates.is_active
    if (updates.is_admin !== undefined) allowedUpdates.is_admin = updates.is_admin
    if (updates.language_preference !== undefined) allowedUpdates.language_preference = updates.language_preference
    if (updates.profile_photo_url !== undefined) allowedUpdates.profile_photo_url = updates.profile_photo_url

    const { data, error } = await supabase
      .from('users')
      .update(allowedUpdates)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ user: data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete user
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = await createClient()

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('email', authUser.email)
      .single()

    if (!adminUser?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Prevent deleting yourself
    const { data: currentUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', authUser.email)
      .single()

    if (currentUser?.user_id === parseInt(user_id)) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user (this will cascade to trips and other related data)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', parseInt(user_id))

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

