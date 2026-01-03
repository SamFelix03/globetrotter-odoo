import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

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
    const body = await request.json()

    const { day_id, activity_id, activity_order, custom_activity_name, custom_description, start_time, end_time, actual_cost, actual_duration, booking_reference, status, notes } = body

    if (!day_id || activity_order === undefined) {
      return NextResponse.json(
        { error: 'Day ID and activity order are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('itinerary_activities')
      .insert({
        day_id,
        activity_id: activity_id || null,
        activity_order,
        custom_activity_name: custom_activity_name || null,
        custom_description: custom_description || null,
        start_time: start_time || null,
        end_time: end_time || null,
        actual_cost: actual_cost || null,
        actual_duration: actual_duration || null,
        booking_reference: booking_reference || null,
        status: status || 'planned',
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

    return NextResponse.json({ activity: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

