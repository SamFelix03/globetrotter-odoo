'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TripViewPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const [trip, setTrip] = useState<any>(null)
  const [itinerary, setItinerary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrip()
    fetchItinerary()
  }, [tripId])

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`)
      const data = await res.json()
      setTrip(data.trip)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching trip:', error)
      setLoading(false)
    }
  }

  const fetchItinerary = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`)
      const data = await res.json()
      setItinerary(data.itinerary || [])
    } catch (error) {
      console.error('Error fetching itinerary:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Trip not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/trips" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
            ← Back to Trips
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {trip.trip_name}
          </h1>
          {trip.trip_description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{trip.trip_description}</p>
          )}
          <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
            <span>
              {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
            </span>
            {trip.estimated_cost && (
              <span>Estimated: ${trip.estimated_cost.toFixed(2)}</span>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Link
            href={`/trips/${tripId}/builder`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Itinerary
          </Link>
          <Link
            href={`/trips/${tripId}/budget`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            View Budget
          </Link>
          <Link
            href={`/trips/${tripId}/calendar`}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            View Calendar
          </Link>
        </div>

        <div className="space-y-8">
          {itinerary.map((stop: any) => (
            <div key={stop.stop_id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {stop.cities?.city_name}, {stop.cities?.country}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {new Date(stop.arrival_date).toLocaleDateString()} - {new Date(stop.departure_date).toLocaleDateString()}
              </p>

              {stop.itinerary_days && stop.itinerary_days.length > 0 && (
                <div className="space-y-4">
                  {stop.itinerary_days.map((day: any) => (
                    <div key={day.day_id} className="border-l-2 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Day {day.day_number} - {new Date(day.day_date).toLocaleDateString()}
                      </h3>
                      {day.itinerary_activities && day.itinerary_activities.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {day.itinerary_activities.map((activity: any) => (
                            <div key={activity.itinerary_activity_id} className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.start_time && activity.end_time && (
                                <span className="font-medium">
                                  {activity.start_time} - {activity.end_time}:{' '}
                                </span>
                              )}
                              {activity.activities?.activity_name || activity.custom_activity_name}
                              {activity.actual_cost && (
                                <span className="ml-2 text-gray-500">(${activity.actual_cost})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

