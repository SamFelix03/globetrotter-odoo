import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// Bulk save/update sections - replaces all sections for a trip
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

    const { sections } = body

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Sections must be an array' },
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

    // Delete all existing sections
    const { error: deleteError } = await supabase
      .from('trip_sections')
      .delete()
      .eq('trip_id', tripId)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    // Insert new sections
    if (sections.length > 0) {
      const sectionsToInsert = sections.map((section: any, index: number) => ({
        trip_id: parseInt(tripId),
        section_order: index + 1,
        category: section.category,
        place: section.place || null,
        price: section.price ? parseFloat(section.price) : null,
        currency_code: section.currency_code || 'USD',
        date_single: section.is_date_range ? null : (section.date_single || null),
        date_start: section.is_date_range ? (section.date_start || null) : null,
        date_end: section.is_date_range ? (section.date_end || null) : null,
        is_date_range: section.is_date_range || false,
        from_location: section.from_location || null,
        to_location: section.to_location || null,
        transport_mode: section.transport_mode || null,
        activity_theme: section.activity_theme || null,
        price_per_night: section.price_per_night ? parseFloat(section.price_per_night) : null,
        metadata: section.metadata || {},
      }))

      const { data, error: insertError } = await supabase
        .from('trip_sections')
        .insert(sectionsToInsert)
        .select()

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ sections: data }, { status: 200 })
    }

    return NextResponse.json({ sections: [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

