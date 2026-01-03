import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = await createClient()

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('email', authUser.email)
      .single()

    if (!user?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get analytics
    const [usersResult, tripsResult, citiesResult, activitiesResult] = await Promise.all([
      supabase.from('users').select('user_id', { count: 'exact' }),
      supabase.from('trips').select('trip_id', { count: 'exact' }),
      supabase.from('cities').select('city_id', { count: 'exact' }),
      supabase.from('activities').select('activity_id', { count: 'exact' }),
    ])

    // Get popular cities
    const { data: popularCities } = await supabase
      .from('cities')
      .select('city_id, city_name, country, popularity_score')
      .order('popularity_score', { ascending: false })
      .limit(10)

    // Get recent trips
    const { data: recentTrips } = await supabase
      .from('trips')
      .select(`
        trip_id,
        trip_name,
        created_at,
        users:user_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get public trips count
    const { count: publicTripsCount } = await supabase
      .from('trips')
      .select('trip_id', { count: 'exact', head: true })
      .eq('is_public', true)

    return NextResponse.json({
      stats: {
        total_users: usersResult.count || 0,
        total_trips: tripsResult.count || 0,
        total_cities: citiesResult.count || 0,
        total_activities: activitiesResult.count || 0,
        public_trips: publicTripsCount || 0,
      },
      popular_cities: popularCities || [],
      recent_trips: recentTrips || [],
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

