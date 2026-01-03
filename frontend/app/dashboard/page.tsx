'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, Plus, ArrowRight, Globe } from 'lucide-react'
import { formatDateDDMMYYYY, formatDateRange } from '@/lib/dateUtils'

export default function DashboardPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])
  const [popularPlaces, setPopularPlaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locationConsent, setLocationConsent] = useState<boolean | null>(null)
  const [userCountry, setUserCountry] = useState<string | null>(null)

  useEffect(() => {
    checkLocationConsent()
    fetchTrips()
  }, [])

  const checkLocationConsent = () => {
    // Check if user has already given consent (stored in cookie)
    const consent = document.cookie
      .split('; ')
      .find(row => row.startsWith('location_consent='))
      ?.split('=')[1]

    // Check if country is already stored
    const storedCountry = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_country='))
      ?.split('=')[1]

    if (consent === 'true' && storedCountry) {
      // User has given consent and country is stored
      setLocationConsent(true)
      setUserCountry(decodeURIComponent(storedCountry))
      fetchPopularPlaces(decodeURIComponent(storedCountry))
    } else if (consent === 'true' && !storedCountry) {
      // User has given consent but country not stored, get location
      setLocationConsent(true)
      getUserLocation()
    } else if (consent === 'false') {
      setLocationConsent(false)
      setLoading(false)
    } else {
      // Ask for consent
      setLocationConsent(null)
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode to get country
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          )
          const data = await response.json()
          const country = data.countryName || data.countryCode
          const state = data.principalSubdivision || data.administrativeArea || ''

          if (country) {
            setUserCountry(country)
            // Store in cookie
            document.cookie = `user_country=${country}; path=/; max-age=${365 * 24 * 60 * 60}`
            if (state) {
              document.cookie = `user_state=${encodeURIComponent(state)}; path=/; max-age=${365 * 24 * 60 * 60}`
            }
            fetchPopularPlaces(country)
          } else {
            setLoading(false)
          }
        } catch (error) {
          console.error('Error getting country from location:', error)
          setLoading(false)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        setLoading(false)
      }
    )
  }

  const handleLocationConsent = (consent: boolean) => {
    // Store consent in cookie (expires in 1 year)
    document.cookie = `location_consent=${consent}; path=/; max-age=${365 * 24 * 60 * 60}`
    setLocationConsent(consent)

    if (consent) {
      getUserLocation()
    } else {
      setLoading(false)
    }
  }

  const fetchTrips = async () => {
    try {
      const tripsRes = await fetch('/api/trips')
      const tripsData = await tripsRes.json()
      setTrips(tripsData.trips?.slice(0, 3) || [])
    } catch (error) {
      console.error('Error fetching trips:', error)
    }
  }

  const fetchPopularPlaces = async (country: string) => {
    try {
      const res = await fetch(`/api/places/popular?country=${encodeURIComponent(country)}`)
      const data = await res.json()
      if (data.places) {
        setPopularPlaces(data.places.slice(0, 6)) // Limit to 6 places
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching popular places:', error)
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
      <div className="relative pt-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/hero-banner.png)',
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
              Plan your next adventure with ease.
            </h1>
            <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl mx-auto drop-shadow-md">
              Create multi-city trips, build detailed itineraries, and track your budget all in one place.
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
        {/* Location Consent Modal */}
        {locationConsent === null && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Location Access</h3>
              <p className="text-gray-600 mb-6">
                We'd like to show you popular destinations in your area. Can we access your location to personalize your experience?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleLocationConsent(true)}
                  className="flex-1 px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors"
                >
                  Allow
                </button>
                <button
                  onClick={() => handleLocationConsent(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popular Destinations Section - Now on Top */}
        {locationConsent === true && (
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Popular Destinations {userCountry && `in ${userCountry}`}
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="text-gray-600">Loading popular destinations...</div>
              </div>
            ) : popularPlaces.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                {popularPlaces.map((place, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center group cursor-pointer"
                    onClick={() => router.push(`/trips/ai-plan?destination=${encodeURIComponent(place.name)}&imageUrl=${encodeURIComponent(place.imageUrl || '')}`)}
                  >
                    <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-xl ring-4 ring-white hover:ring-green-200 transition-all hover:scale-105 mb-4">
                      {place.imageUrl ? (
                        <img
                          src={place.imageUrl}
                          alt={place.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/trip-default-img.png'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <MapPin className="w-16 h-16 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-center max-w-[160px]">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-800 transition-colors leading-tight mb-1.5">
                        {place.name}
                      </h3>
                      {place.rating && (
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <span className="text-yellow-500 text-base">⭐</span>
                          <span className="font-medium">{place.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600">No popular destinations found for your location.</p>
              </div>
            )}
          </div>
        )}

        {/* Your Recent Trips Section - Now Below */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Your Recent Trips</h2>
            <Link
              href="/trips"
              className="text-green-800 hover:text-green-900 font-medium flex items-center gap-1 transition-colors"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trips.map((trip) => (
                <Link
                  key={trip.trip_id}
                  href={`/trips/${trip.trip_id}`}
                  className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-green-300 group"
                >
                  <div className="h-56 overflow-hidden">
                    <img
                      src={trip.cover_photo_url || '/trip-default-img.png'}
                      alt={trip.trip_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/trip-default-img.png'
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-800 transition-colors">
                      {trip.trip_name}
                    </h3>
                    {trip.trip_description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {trip.trip_description}
                      </p>
                    )}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {formatDateRange(trip.start_date, trip.end_date)}
                        </span>
                      </div>
                      {trip.estimated_cost && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">₹{trip.estimated_cost.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
