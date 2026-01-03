import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch a single comment with full trip details including sections
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const { commentId } = resolvedParams

    // Fetch comment with user and trip details
    const { data: comment, error } = await supabase
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
          cover_photo_url,
          total_budget,
          estimated_cost
        )
      `)
      .eq('comment_id', commentId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Fetch trip sections
    const { data: sections } = await supabase
      .from('trip_sections')
      .select('*')
      .eq('trip_id', comment.trip_id)
      .order('section_order', { ascending: true })

    // Transform the data
    const transformedComment = {
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
        total_budget: comment.trips?.total_budget,
        estimated_cost: comment.trips?.estimated_cost,
        sections: sections || [],
      },
    }

    return NextResponse.json({ comment: transformedComment }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

