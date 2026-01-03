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
    const { tripId } = await params

    // Get original trip
    const { data: originalTrip } = await supabase
      .from('trips')
      .select('*')
      .eq('trip_id', tripId)
      .single()

    if (!originalTrip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Get user_id
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

    // Create new trip
    const { data: newTrip, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: userData.user_id,
        trip_name: `${originalTrip.trip_name} (Copy)`,
        trip_description: originalTrip.trip_description,
        start_date: originalTrip.start_date,
        end_date: originalTrip.end_date,
        cover_photo_url: originalTrip.cover_photo_url,
        total_budget: originalTrip.total_budget,
        is_public: false,
      })
      .select()
      .single()

    if (tripError) {
      return NextResponse.json(
        { error: tripError.message },
        { status: 500 }
      )
    }

    // Copy trip sections (new itinerary builder)
    const { data: originalSections } = await supabase
      .from('trip_sections')
      .select('*')
      .eq('trip_id', tripId)
      .order('section_order', { ascending: true })

    if (originalSections && originalSections.length > 0) {
      const newSections = originalSections.map((section: any) => ({
        trip_id: newTrip.trip_id,
        section_order: section.section_order,
        category: section.category,
        place: section.place,
        price: section.price,
        currency_code: section.currency_code,
        date_single: section.date_single,
        date_start: section.date_start,
        date_end: section.date_end,
        is_date_range: section.is_date_range,
        from_location: section.from_location,
        to_location: section.to_location,
        transport_mode: section.transport_mode,
        activity_theme: section.activity_theme,
        price_per_night: section.price_per_night,
        metadata: section.metadata || {},
      }))

      const { error: sectionsError } = await supabase
        .from('trip_sections')
        .insert(newSections)

      if (sectionsError) {
        console.error('Error copying sections:', sectionsError)
        // Continue even if sections copy fails
      }
    }

    // Copy stops (legacy itinerary)
    const { data: originalStops } = await supabase
      .from('trip_stops')
      .select('*')
      .eq('trip_id', tripId)
      .order('stop_order', { ascending: true })

    if (originalStops && originalStops.length > 0) {
      const newStops = originalStops.map(stop => ({
        trip_id: newTrip.trip_id,
        city_id: stop.city_id,
        stop_order: stop.stop_order,
        arrival_date: stop.arrival_date,
        departure_date: stop.departure_date,
        accommodation_name: stop.accommodation_name,
        accommodation_cost: stop.accommodation_cost,
        accommodation_url: stop.accommodation_url,
        transport_to_next_stop: stop.transport_to_next_stop,
        transport_cost: stop.transport_cost,
        notes: stop.notes,
      }))

      const { data: insertedStops } = await supabase
        .from('trip_stops')
        .insert(newStops)
        .select()

      // Copy days and activities
      if (insertedStops) {
        for (let i = 0; i < originalStops.length; i++) {
          const originalStop = originalStops[i]
          const newStop = insertedStops[i]

          const { data: originalDays } = await supabase
            .from('itinerary_days')
            .select('*')
            .eq('stop_id', originalStop.stop_id)

          if (originalDays && originalDays.length > 0) {
            const newDays = originalDays.map(day => ({
              stop_id: newStop.stop_id,
              day_date: day.day_date,
              day_number: day.day_number,
              notes: day.notes,
            }))

            const { data: insertedDays } = await supabase
              .from('itinerary_days')
              .insert(newDays)
              .select()

            // Copy activities
            if (insertedDays) {
              for (let j = 0; j < originalDays.length; j++) {
                const originalDay = originalDays[j]
                const newDay = insertedDays[j]

                const { data: originalActivities } = await supabase
                  .from('itinerary_activities')
                  .select('*')
                  .eq('day_id', originalDay.day_id)
                  .order('activity_order', { ascending: true })

                if (originalActivities && originalActivities.length > 0) {
                  const newActivities = originalActivities.map(activity => ({
                    day_id: newDay.day_id,
                    activity_id: activity.activity_id,
                    activity_order: activity.activity_order,
                    custom_activity_name: activity.custom_activity_name,
                    custom_description: activity.custom_description,
                    start_time: activity.start_time,
                    end_time: activity.end_time,
                    actual_cost: activity.actual_cost,
                    actual_duration: activity.actual_duration,
                    booking_reference: activity.booking_reference,
                    status: activity.status,
                    notes: activity.notes,
                  }))

                  await supabase
                    .from('itinerary_activities')
                    .insert(newActivities)
                }
              }
            }
          }
        }
      }
    }

    // Increment copy count on original trip
    await supabase
      .from('trips')
      .update({ copy_count: (originalTrip.copy_count || 0) + 1 })
      .eq('trip_id', tripId)

    return NextResponse.json({ trip: newTrip }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

