'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])
  const [popularCities, setPopularCities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tripsRes, citiesRes] = await Promise.all([
        fetch('/api/trips'),
        fetch('/api/cities?limit=6'),
      ])

      const tripsData = await tripsRes.json()
      const citiesData = await citiesRes.json()

      setTrips(tripsData.trips?.slice(0, 3) || [])
      setPopularCities(citiesData.cities || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to GlobeTrotter
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Plan your next adventure with ease
          </p>
        </div>

        <div className="mb-8">
          <Link
            href="/trips/create"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ✈️ Plan New Trip
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Trips
            </h2>
            {trips.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-500 dark:text-gray-400">
                  You haven't created any trips yet. Start planning your first adventure!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <Link
                    key={trip.trip_id}
                    href={`/trips/${trip.trip_id}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {trip.trip_name}
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                    </p>
                    {trip.estimated_cost && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Estimated: ${trip.estimated_cost.toFixed(2)}
                      </p>
                    )}
                  </Link>
                ))}
                <Link
                  href="/trips"
                  className="block text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all trips →
                </Link>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Popular Destinations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {popularCities.map((city) => (
                <Link
                  key={city.city_id}
                  href={`/cities/search?city_id=${city.city_id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {city.city_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {city.country}
                  </p>
                  {city.cost_index && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      ${city.cost_index}/day
                    </p>
                  )}
                </Link>
              ))}
            </div>
            <Link
              href="/cities/search"
              className="block mt-4 text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Explore more cities →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

