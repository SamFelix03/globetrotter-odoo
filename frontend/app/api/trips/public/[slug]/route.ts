import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient()
    const { slug } = await params

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        users:user_id (
          user_id,
          full_name,
          email
        )
      `)
      .eq('public_url_slug', slug)
      .eq('is_public', true)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found or not public' },
        { status: 404 }
      )
    }

    // Increment view count
    await supabase
      .from('trips')
      .update({ view_count: (trip.view_count || 0) + 1 })
      .eq('trip_id', trip.trip_id)

    // Get full itinerary
    const { data: stops } = await supabase
      .from('trip_stops')
      .select(`
        *,
        cities:city_id (
          city_id,
          city_name,
          country,
          region,
          cost_index,
          cover_image_url
        ),
        itinerary_days (
          *,
          itinerary_activities (
            *,
            activities:activity_id (
              activity_id,
              activity_name,
              description,
              estimated_cost,
              estimated_duration,
              image_url,
              booking_url
            )
          )
        )
      `)
      .eq('trip_id', trip.trip_id)
      .order('stop_order', { ascending: true })

    return NextResponse.json({
      trip: {
        ...trip,
        itinerary: stops || []
      }
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

