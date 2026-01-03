import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createClient()
    const { tripId } = params

    // Get all stops with their days and activities
    const { data: stops, error: stopsError } = await supabase
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
      .eq('trip_id', tripId)
      .order('stop_order', { ascending: true })

    if (stopsError) {
      return NextResponse.json(
        { error: stopsError.message },
        { status: 500 }
      )
    }

    // Organize days by date
    const itinerary = stops?.map(stop => ({
      ...stop,
      days: stop.itinerary_days?.map((day: any) => ({
        ...day,
        activities: day.itinerary_activities?.sort((a: any, b: any) => 
          a.activity_order - b.activity_order
        ) || []
      })).sort((a: any, b: any) => 
        new Date(a.day_date).getTime() - new Date(b.day_date).getTime()
      ) || []
    })) || []

    return NextResponse.json({ itinerary }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

