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

    // Get trips created over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: tripsOverTime } = await supabase
      .from('trips')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group trips by date
    const tripsByDate: Record<string, number> = {}
    tripsOverTime?.forEach(trip => {
      const date = new Date(trip.created_at).toISOString().split('T')[0]
      tripsByDate[date] = (tripsByDate[date] || 0) + 1
    })

    // Get users registered over time (last 30 days)
    const { data: usersOverTime } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group users by date
    const usersByDate: Record<string, number> = {}
    usersOverTime?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      usersByDate[date] = (usersByDate[date] || 0) + 1
    })

    // Get top activities (by usage in itineraries)
    const { data: activityUsage } = await supabase
      .from('itinerary_activities')
      .select('activity_id, activities:activity_id(activity_name, category)')
      .limit(1000)

    const activityCounts: Record<string, { name: string; count: number; category: string }> = {}
    activityUsage?.forEach(item => {
      if (item.activities) {
        const activity = item.activities as any
        const key = activity.activity_name || 'Unknown'
        if (!activityCounts[key]) {
          activityCounts[key] = { name: key, count: 0, category: activity.category || 'Other' }
        }
        activityCounts[key].count++
      }
    })

    const topActivities = Object.values(activityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get user engagement stats
    const { data: allUsers } = await supabase
      .from('users')
      .select('user_id, created_at')
    
    const { data: allTrips } = await supabase
      .from('trips')
      .select('user_id, created_at, view_count, copy_count')

    // Calculate average trips per user
    const tripsPerUser = allTrips?.reduce((acc, trip) => {
      acc[trip.user_id] = (acc[trip.user_id] || 0) + 1
      return acc
    }, {} as Record<number, number>) || {}

    const usersWithTrips = Object.keys(tripsPerUser).length
    const avgTripsPerUser = usersWithTrips > 0 
      ? Object.values(tripsPerUser).reduce((a, b) => a + b, 0) / usersWithTrips 
      : 0

    // Get total views and copies
    const totalViews = allTrips?.reduce((sum, trip) => sum + (trip.view_count || 0), 0) || 0
    const totalCopies = allTrips?.reduce((sum, trip) => sum + (trip.copy_count || 0), 0) || 0

    // Get active users (users who created trips in last 30 days)
    const activeUserIds = new Set(
      allTrips?.filter(trip => new Date(trip.created_at) >= thirtyDaysAgo)
        .map(trip => trip.user_id) || []
    )

    // Get trip distribution (public vs private)
    const { count: privateTripsCount } = await supabase
      .from('trips')
      .select('trip_id', { count: 'exact', head: true })
      .eq('is_public', false)

    return NextResponse.json({
      stats: {
        total_users: usersResult.count || 0,
        total_trips: tripsResult.count || 0,
        total_cities: citiesResult.count || 0,
        total_activities: activitiesResult.count || 0,
        public_trips: publicTripsCount || 0,
        private_trips: privateTripsCount || 0,
        active_users: activeUserIds.size,
        avg_trips_per_user: Math.round(avgTripsPerUser * 10) / 10,
        total_views: totalViews,
        total_copies: totalCopies,
      },
      popular_cities: popularCities || [],
      recent_trips: recentTrips || [],
      trips_over_time: tripsByDate,
      users_over_time: usersByDate,
      top_activities: topActivities,
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

