import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
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
    const { tripId } = params
    const body = await request.json()

    const { stop_id, day_date, day_number, notes } = body

    if (!stop_id || !day_date || day_number === undefined) {
      return NextResponse.json(
        { error: 'Stop ID, day date, and day number are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('itinerary_days')
      .insert({
        stop_id,
        day_date,
        day_number,
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

    return NextResponse.json({ day: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

