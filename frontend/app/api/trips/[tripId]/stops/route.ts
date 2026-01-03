import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const supabase = await createClient()
    const { tripId } = await params

    const { data, error } = await supabase
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
        )
      `)
      .eq('trip_id', tripId)
      .order('stop_order', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ stops: data || [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = await createClient()
    const { tripId } = await params
    const body = await request.json()

    const { city_id, arrival_date, departure_date, accommodation_name, accommodation_cost, accommodation_url, transport_to_next_stop, transport_cost, notes } = body

    if (!city_id || !arrival_date || !departure_date) {
      return NextResponse.json(
        { error: 'City ID, arrival date, and departure date are required' },
        { status: 400 }
      )
    }

    // Get current max stop_order
    const { data: existingStops } = await supabase
      .from('trip_stops')
      .select('stop_order')
      .eq('trip_id', tripId)
      .order('stop_order', { ascending: false })
      .limit(1)

    const stop_order = existingStops && existingStops.length > 0
      ? existingStops[0].stop_order + 1
      : 1

    const { data, error } = await supabase
      .from('trip_stops')
      .insert({
        trip_id: parseInt(tripId),
        city_id,
        stop_order,
        arrival_date,
        departure_date,
        accommodation_name: accommodation_name || null,
        accommodation_cost: accommodation_cost || null,
        accommodation_url: accommodation_url || null,
        transport_to_next_stop: transport_to_next_stop || null,
        transport_cost: transport_cost || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ stop: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

