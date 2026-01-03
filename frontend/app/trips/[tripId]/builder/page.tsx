'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ItineraryBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const [trip, setTrip] = useState<any>(null)
  const [stops, setStops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCitySearch, setShowCitySearch] = useState(false)

  useEffect(() => {
    fetchTrip()
    fetchStops()
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

  const fetchStops = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/stops`)
      const data = await res.json()
      setStops(data.stops || [])
    } catch (error) {
      console.error('Error fetching stops:', error)
    }
  }

  const handleAddStop = async (cityId: number, arrivalDate: string, departureDate: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city_id: cityId,
          arrival_date: arrivalDate,
          departure_date: departureDate,
        }),
      })

      if (res.ok) {
        fetchStops()
        setShowCitySearch(false)
      }
    } catch (error) {
      console.error('Error adding stop:', error)
    }
  }

  const handleDeleteStop = async (stopId: number) => {
    if (!confirm('Are you sure you want to delete this stop?')) return

    try {
      const res = await fetch(`/api/trips/${tripId}/stops/${stopId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchStops()
      }
    } catch (error) {
      console.error('Error deleting stop:', error)
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
          <Link href={`/trips/${tripId}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
            ← Back to Trip
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Itinerary Builder: {trip?.trip_name}
          </h1>
          <button
            onClick={() => setShowCitySearch(!showCitySearch)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Add Stop
          </button>
        </div>

        {showCitySearch && (
          <div className="mb-8">
            <CitySearchModal
              onSelectCity={(cityId, arrivalDate, departureDate) =>
                handleAddStop(cityId, arrivalDate, departureDate)
              }
              onClose={() => setShowCitySearch(false)}
            />
          </div>
        )}

        <div className="space-y-6">
          {stops.map((stop, index) => (
            <StopBuilder
              key={stop.stop_id}
              stop={stop}
              tripId={tripId}
              onDelete={() => handleDeleteStop(stop.stop_id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CitySearchModal({ onSelectCity, onClose }: any) {
  const [search, setSearch] = useState('')
  const [cities, setCities] = useState<any[]>([])
  const [arrivalDate, setArrivalDate] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [selectedCity, setSelectedCity] = useState<any>(null)

  useEffect(() => {
    if (search) {
      fetchCities()
    }
  }, [search])

  const fetchCities = async () => {
    try {
      const res = await fetch(`/api/cities?search=${encodeURIComponent(search)}&limit=10`)
      const data = await res.json()
      setCities(data.cities || [])
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  const handleSelect = () => {
    if (selectedCity && arrivalDate && departureDate) {
      onSelectCity(selectedCity.city_id, arrivalDate, departureDate)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Search and Add City</h2>
      <input
        type="text"
        placeholder="Search cities..."
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md mb-4 dark:bg-gray-700 dark:text-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="date"
          placeholder="Arrival Date"
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
          value={arrivalDate}
          onChange={(e) => setArrivalDate(e.target.value)}
        />
        <input
          type="date"
          placeholder="Departure Date"
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
        />
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
        {cities.map((city) => (
          <div
            key={city.city_id}
            onClick={() => setSelectedCity(city)}
            className={`p-3 border rounded cursor-pointer ${
              selectedCity?.city_id === city.city_id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <div className="font-semibold">{city.city_name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{city.country}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSelect}
          disabled={!selectedCity || !arrivalDate || !departureDate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Add Stop
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function StopBuilder({ stop, tripId, onDelete }: any) {
  const [days, setDays] = useState<any[]>([])
  const [showActivitySearch, setShowActivitySearch] = useState(false)
  const [selectedDay, setSelectedDay] = useState<any>(null)

  useEffect(() => {
    fetchDays()
  }, [stop.stop_id])

  const fetchDays = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`)
      const data = await res.json()
      const stopData = data.itinerary?.find((s: any) => s.stop_id === stop.stop_id)
      setDays(stopData?.itinerary_days || [])
    } catch (error) {
      console.error('Error fetching days:', error)
    }
  }

  const handleAddDay = async () => {
    const dayNumber = days.length + 1
    const dayDate = new Date(stop.arrival_date)
    dayDate.setDate(dayDate.getDate() + days.length)

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stop_id: stop.stop_id,
          day_date: dayDate.toISOString().split('T')[0],
          day_number: dayNumber,
        }),
      })

      if (res.ok) {
        fetchDays()
      }
    } catch (error) {
      console.error('Error adding day:', error)
    }
  }

  const handleAddActivity = async (activityId: number | null, customName: string | null) => {
    if (!selectedDay) return

    const activityOrder = (selectedDay.itinerary_activities?.length || 0) + 1

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_id: selectedDay.day_id,
          activity_id: activityId,
          activity_order: activityOrder,
          custom_activity_name: customName,
        }),
      })

      if (res.ok) {
        fetchDays()
        setShowActivitySearch(false)
        setSelectedDay(null)
      }
    } catch (error) {
      console.error('Error adding activity:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {stop.cities?.city_name}, {stop.cities?.country}
        </h2>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-red-600 hover:text-red-700 dark:text-red-400"
        >
          Delete
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={handleAddDay}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
        >
          + Add Day
        </button>
      </div>

      <div className="space-y-4">
        {days.map((day: any) => (
          <div key={day.day_id} className="border-l-2 border-blue-500 pl-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Day {day.day_number} - {new Date(day.day_date).toLocaleDateString()}
              </h3>
              <button
                onClick={() => {
                  setSelectedDay(day)
                  setShowActivitySearch(true)
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                + Add Activity
              </button>
            </div>
            {day.itinerary_activities && day.itinerary_activities.length > 0 && (
              <div className="space-y-1">
                {day.itinerary_activities.map((activity: any) => (
                  <div key={activity.itinerary_activity_id} className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.activities?.activity_name || activity.custom_activity_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showActivitySearch && (
        <ActivitySearchModal
          cityId={stop.city_id}
          onSelectActivity={(activityId, customName) => handleAddActivity(activityId, customName)}
          onClose={() => {
            setShowActivitySearch(false)
            setSelectedDay(null)
          }}
        />
      )}
    </div>
  )
}

function ActivitySearchModal({ cityId, onSelectActivity, onClose }: any) {
  const [activities, setActivities] = useState<any[]>([])
  const [customName, setCustomName] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<any>(null)

  useEffect(() => {
    fetchActivities()
  }, [cityId])

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/activities?city_id=${cityId}`)
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const handleSelect = () => {
    if (selectedActivity) {
      onSelectActivity(selectedActivity.activity_id, null)
    } else if (customName) {
      onSelectActivity(null, customName)
    }
  }

  return (
    <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <h3 className="font-semibold mb-2">Add Activity</h3>
      <input
        type="text"
        placeholder="Or enter custom activity name"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 dark:bg-gray-800 dark:text-white"
        value={customName}
        onChange={(e) => {
          setCustomName(e.target.value)
          setSelectedActivity(null)
        }}
      />
      <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
        {activities.map((activity) => (
          <div
            key={activity.activity_id}
            onClick={() => {
              setSelectedActivity(activity)
              setCustomName('')
            }}
            className={`p-2 border rounded cursor-pointer text-sm ${
              selectedActivity?.activity_id === activity.activity_id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="font-medium">{activity.activity_name}</div>
            {activity.estimated_cost && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                ${activity.estimated_cost}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSelect}
          disabled={!selectedActivity && !customName}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          Add
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

