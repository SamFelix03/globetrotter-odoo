import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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

    // Verify trip ownership or public access
    const { data: trip } = await supabase
      .from('trips')
      .select('user_id, is_public')
      .eq('trip_id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check if user owns the trip or if trip is public
    const { data: userData } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', authUser.email)
      .single()

    if (trip.user_id !== userData?.user_id && !trip.is_public) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('trip_sections')
      .select('*')
      .eq('trip_id', tripId)
      .order('section_order', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ sections: data || [] }, { status: 200 })
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

    // Verify trip ownership
    const { data: trip } = await supabase
      .from('trips')
      .select('user_id')
      .eq('trip_id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', authUser.email)
      .single()

    if (trip.user_id !== userData?.user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const {
      category,
      place,
      price,
      currency_code = 'INR',
      date_single,
      date_start,
      date_end,
      is_date_range = false,
      from_location,
      to_location,
      transport_mode,
      activity_theme,
      price_per_night,
      metadata = {},
    } = body

    if (!category || !['travel', 'activity', 'stay'].includes(category)) {
      return NextResponse.json(
        { error: 'Valid category (travel, activity, or stay) is required' },
        { status: 400 }
      )
    }

    // Get current max section_order
    const { data: existingSections } = await supabase
      .from('trip_sections')
      .select('section_order')
      .eq('trip_id', tripId)
      .order('section_order', { ascending: false })
      .limit(1)

    const section_order = existingSections && existingSections.length > 0
      ? existingSections[0].section_order + 1
      : 1

    const { data, error } = await supabase
      .from('trip_sections')
      .insert({
        trip_id: parseInt(tripId),
        section_order,
        category,
        place: place || null,
        price: price ? parseFloat(price) : null,
        currency_code,
        date_single: is_date_range ? null : (date_single || null),
        date_start: is_date_range ? (date_start || null) : null,
        date_end: is_date_range ? (date_end || null) : null,
        is_date_range,
        from_location: from_location || null,
        to_location: to_location || null,
        transport_mode: transport_mode || null,
        activity_theme: activity_theme || null,
        price_per_night: price_per_night ? parseFloat(price_per_night) : null,
        metadata,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ section: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { section_id, ...updateData } = body

    if (!section_id) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    // Verify trip ownership
    const { data: trip } = await supabase
      .from('trips')
      .select('user_id')
      .eq('trip_id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', authUser.email)
      .single()

    if (trip.user_id !== userData?.user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateFields: any = {}
    if (updateData.place !== undefined) updateFields.place = updateData.place
    if (updateData.price !== undefined) updateFields.price = updateData.price ? parseFloat(updateData.price) : null
    if (updateData.currency_code !== undefined) updateFields.currency_code = updateData.currency_code
    if (updateData.is_date_range !== undefined) {
      updateFields.is_date_range = updateData.is_date_range
      if (updateData.is_date_range) {
        updateFields.date_single = null
        if (updateData.date_start) updateFields.date_start = updateData.date_start
        if (updateData.date_end) updateFields.date_end = updateData.date_end
      } else {
        updateFields.date_start = null
        updateFields.date_end = null
        if (updateData.date_single) updateFields.date_single = updateData.date_single
      }
    } else {
      if (updateData.date_single !== undefined) updateFields.date_single = updateData.date_single
      if (updateData.date_start !== undefined) updateFields.date_start = updateData.date_start
      if (updateData.date_end !== undefined) updateFields.date_end = updateData.date_end
    }
    if (updateData.from_location !== undefined) updateFields.from_location = updateData.from_location
    if (updateData.to_location !== undefined) updateFields.to_location = updateData.to_location
    if (updateData.transport_mode !== undefined) updateFields.transport_mode = updateData.transport_mode
    if (updateData.activity_theme !== undefined) updateFields.activity_theme = updateData.activity_theme
    if (updateData.price_per_night !== undefined) updateFields.price_per_night = updateData.price_per_night ? parseFloat(updateData.price_per_night) : null
    if (updateData.metadata !== undefined) updateFields.metadata = updateData.metadata

    const { data, error } = await supabase
      .from('trip_sections')
      .update(updateFields)
      .eq('section_id', section_id)
      .eq('trip_id', tripId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ section: data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const searchParams = request.nextUrl.searchParams
    const sectionId = searchParams.get('section_id')

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    // Verify trip ownership
    const { data: trip } = await supabase
      .from('trips')
      .select('user_id')
      .eq('trip_id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', authUser.email)
      .single()

    if (trip.user_id !== userData?.user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('trip_sections')
      .delete()
      .eq('section_id', sectionId)
      .eq('trip_id', tripId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Section deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

