'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function PublicTripPage() {
  const params = useParams()
  const slug = params.slug as string
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrip()
  }, [slug])

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/trips/public/${slug}`)
      const data = await res.json()
      setTrip(data.trip)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching trip:', error)
      setLoading(false)
    }
  }

  const handleCopyTrip = async () => {
    try {
      const res = await fetch(`/api/trips/${trip.trip_id}/copy`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        alert('Trip copied successfully!')
        window.location.href = `/trips/${data.trip.trip_id}`
      }
    } catch (error) {
      console.error('Error copying trip:', error)
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
        <div className="text-lg">Trip not found or not public</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {trip.trip_name}
              </h1>
              {trip.users && (
                <p className="text-gray-600 dark:text-gray-400">
                  by {trip.users.full_name || trip.users.email}
                </p>
              )}
            </div>
            <button
              onClick={handleCopyTrip}
              className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
            >
              Copy Trip
            </button>
          </div>
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
            <span>{trip.view_count || 0} views</span>
          </div>
        </div>

        <div className="space-y-8">
          {trip.itinerary?.map((stop: any) => (
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
                    <div key={day.day_id} className="border-l-2 border-green-800 pl-4">
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

