'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, DollarSign, Plus, ArrowRight, Globe } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-800 via-green-700 to-green-900 text-white pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to GlobeTrotter
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-2xl mx-auto">
              Plan your next adventure with ease. Create multi-city trips, build detailed itineraries, and track your budget all in one place.
            </p>
            <Link
              href="/trips/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-800 font-semibold rounded-lg shadow-lg hover:bg-green-50 transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Plan New Trip
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Recent Trips Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Recent Trips</h2>
            <Link
              href="/trips"
              className="text-green-800 hover:text-green-900 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-6 text-lg">
                You haven't created any trips yet. Start planning your first adventure!
              </p>
              <Link
                href="/trips/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-800 text-white font-medium rounded-lg hover:bg-green-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Trip
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <Link
                  key={trip.trip_id}
                  href={`/trips/${trip.trip_id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-green-300 group"
                >
                  {trip.cover_photo_url ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={trip.cover_photo_url}
                        alt={trip.trip_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <Globe className="w-16 h-16 text-green-600" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-800 transition-colors">
                      {trip.trip_name}
                    </h3>
                    {trip.trip_description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {trip.trip_description}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {trip.estimated_cost && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">${trip.estimated_cost.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Popular Destinations Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popular Destinations</h2>
            <Link
              href="/cities/search"
              className="text-green-800 hover:text-green-900 font-medium flex items-center gap-1"
            >
              Explore more
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularCities.map((city) => (
              <Link
                key={city.city_id}
                href={`/cities/search?city_id=${city.city_id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-green-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-800 transition-colors mb-1">
                      {city.city_name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{city.country}</span>
                    </div>
                  </div>
                </div>
                {city.cost_index && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      <span className="font-medium">${city.cost_index}</span>/day
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
