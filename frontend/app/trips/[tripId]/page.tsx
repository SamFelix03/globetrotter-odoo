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
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrip()
    fetchItinerary()
    fetchSections()
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

  const fetchSections = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/sections`)
      const data = await res.json()
      setSections(data.sections || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Trip not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/trips" className="text-green-800 hover:text-green-900">
            ← Back to Trips
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {trip.trip_name}
          </h1>
          {trip.trip_description && (
            <p className="text-gray-600 mb-4">{trip.trip_description}</p>
          )}
          <div className="flex gap-6 text-sm text-gray-600">
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
            className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
          >
            Edit Itinerary
          </Link>
          <Link
            href={`/trips/${tripId}/budget`}
            className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
          >
            View Budget
          </Link>
          <Link
            href={`/trips/${tripId}/calendar`}
            className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
          >
            View Calendar
          </Link>
        </div>

        {/* Display Trip Sections (New Itinerary Builder) */}
        {sections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Itinerary</h2>
            <div className="space-y-6">
              {sections.map((section: any, index: number) => (
                <div key={section.section_id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold">
                        {index + 1}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium capitalize bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {section.category}
                      </span>
                    </div>
                  </div>

                  {/* Travel Section */}
                  {section.category === 'travel' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {section.from_location || 'From'} → {section.to_location || 'To'}
                        </span>
                        {section.transport_mode && (
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">
                            {section.transport_mode}
                          </span>
                        )}
                      </div>
                      {section.place && (
                        <p className="text-gray-600 dark:text-gray-400">{section.place}</p>
                      )}
                      {section.price && (
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ${section.price.toFixed(2)} {section.currency_code || 'USD'}
                        </p>
                      )}
                      {section.is_date_range ? (
                        section.date_start && section.date_end && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(section.date_start).toLocaleDateString()} - {new Date(section.date_end).toLocaleDateString()}
                          </p>
                        )
                      ) : (
                        section.date_single && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(section.date_single).toLocaleDateString()}
                          </p>
                        )
                      )}
                    </div>
                  )}

                  {/* Activity Section */}
                  {section.category === 'activity' && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {section.place || 'Activity'}
                      </h3>
                      {section.activity_theme && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Theme: <span className="font-medium">{section.activity_theme}</span>
                        </p>
                      )}
                      {section.price && (
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ${section.price.toFixed(2)} {section.currency_code || 'USD'}
                        </p>
                      )}
                      {section.date_single && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(section.date_single).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stay Section */}
                  {section.category === 'stay' && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {section.place || 'Accommodation'}
                      </h3>
                      {section.price_per_night && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ${section.price_per_night.toFixed(2)} {section.currency_code || 'USD'} per night
                        </p>
                      )}
                      {section.price && (
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          Total: ${section.price.toFixed(2)} {section.currency_code || 'USD'}
                        </p>
                      )}
                      {section.is_date_range ? (
                        section.date_start && section.date_end && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(section.date_start).toLocaleDateString()} - {new Date(section.date_end).toLocaleDateString()}
                          </p>
                        )
                      ) : (
                        section.date_single && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(section.date_single).toLocaleDateString()}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display Legacy Itinerary (if exists and no sections) */}
        {sections.length === 0 && itinerary.length > 0 && (
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
        )}

        {/* Empty State */}
        {sections.length === 0 && itinerary.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No itinerary sections yet.</p>
            <Link
              href={`/trips/${tripId}/builder`}
              className="inline-block px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
            >
              Create Itinerary
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

