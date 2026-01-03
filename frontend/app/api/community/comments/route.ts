import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch all community comments with user and trip details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch comments with user and trip details
    const { data: comments, error } = await supabase
      .from('community_comments')
      .select(`
        comment_id,
        comment_text,
        created_at,
        updated_at,
        like_count,
        user_id,
        trip_id,
        users:user_id (
          user_id,
          full_name,
          email,
          profile_photo_url
        ),
        trips:trip_id (
          trip_id,
          trip_name,
          trip_description,
          start_date,
          end_date,
          cover_photo_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform the data to flatten the nested structure
    const transformedComments = comments?.map((comment: any) => ({
      comment_id: comment.comment_id,
      comment_text: comment.comment_text,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      like_count: comment.like_count || 0,
      user: {
        user_id: comment.users?.user_id,
        full_name: comment.users?.full_name,
        email: comment.users?.email,
        profile_photo_url: comment.users?.profile_photo_url,
      },
      trip: {
        trip_id: comment.trips?.trip_id,
        trip_name: comment.trips?.trip_name,
        trip_description: comment.trips?.trip_description,
        start_date: comment.trips?.start_date,
        end_date: comment.trips?.end_date,
        cover_photo_url: comment.trips?.cover_photo_url,
      },
    })) || []

    return NextResponse.json({ comments: transformedComments }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new community comment
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
    const { trip_id, comment_text } = body

    if (!trip_id || !comment_text || comment_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Trip ID and comment text are required' },
        { status: 400 }
      )
    }

    // Get user_id from email
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

    // Verify trip exists and belongs to user
    const { data: trip } = await supabase
      .from('trips')
      .select('trip_id, user_id')
      .eq('trip_id', trip_id)
      .single()

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    if (trip.user_id !== userData.user_id) {
      return NextResponse.json(
        { error: 'You can only share your own trips' },
        { status: 403 }
      )
    }

    // Create the comment
    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        user_id: userData.user_id,
        trip_id: parseInt(trip_id),
        comment_text: comment_text.trim(),
      })
      .select(`
        comment_id,
        comment_text,
        created_at,
        updated_at,
        like_count,
        user_id,
        trip_id,
        users:user_id (
          user_id,
          full_name,
          email,
          profile_photo_url
        ),
        trips:trip_id (
          trip_id,
          trip_name,
          trip_description,
          start_date,
          end_date,
          cover_photo_url
        )
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform the response
    const transformedComment = {
      comment_id: data.comment_id,
      comment_text: data.comment_text,
      created_at: data.created_at,
      updated_at: data.updated_at,
      like_count: data.like_count || 0,
      user: {
        user_id: data.users?.user_id,
        full_name: data.users?.full_name,
        email: data.users?.email,
        profile_photo_url: data.users?.profile_photo_url,
      },
      trip: {
        trip_id: data.trips?.trip_id,
        trip_name: data.trips?.trip_name,
        trip_description: data.trips?.trip_description,
        start_date: data.trips?.start_date,
        end_date: data.trips?.end_date,
        cover_photo_url: data.trips?.cover_photo_url,
      },
    }

    return NextResponse.json({ comment: transformedComment }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

