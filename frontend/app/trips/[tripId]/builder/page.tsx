'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DateRangePicker from '@/components/DateRangePicker'

export default function ItineraryBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const [trip, setTrip] = useState<any>(null)
  const [stops, setStops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize form IDs from cache synchronously if available
  const getInitialFormIds = () => {
    if (typeof window === 'undefined') return []
    try {
      const cachedIds = localStorage.getItem(`sectionFormIds_${tripId}`)
      if (cachedIds) {
        const ids = JSON.parse(cachedIds)
        if (Array.isArray(ids) && ids.length > 0) {
          return ids
        }
      }
    } catch (error) {
      console.error('Error loading cached form IDs:', error)
    }
    return []
  }

  const getInitialNextFormId = () => {
    if (typeof window === 'undefined') return 1
    try {
      const cachedNextId = localStorage.getItem(`nextFormId_${tripId}`)
      if (cachedNextId) {
        const nextId = parseInt(cachedNextId, 10)
        if (!isNaN(nextId)) {
          return nextId
        }
      }
    } catch (error) {
      console.error('Error loading cached next form ID:', error)
    }
    return 1
  }

  const [sectionFormIds, setSectionFormIds] = useState<number[]>(getInitialFormIds)
  const [nextFormId, setNextFormId] = useState(getInitialNextFormId)

  // Save form IDs to cache whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`sectionFormIds_${tripId}`, JSON.stringify(sectionFormIds))
      localStorage.setItem(`nextFormId_${tripId}`, nextFormId.toString())
    }
  }, [sectionFormIds, nextFormId, tripId])

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
            onClick={() => {
              const newId = nextFormId
              setSectionFormIds([...sectionFormIds, newId])
              setNextFormId(newId + 1)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Add Section
          </button>
        </div>

        {sectionFormIds.map((formId, index) => (
          <div key={formId} className="mb-8">
            <SectionForm
              formId={formId}
              tripId={tripId}
              onClose={() => {
                // Clear cache when closing
                const cacheKey = `sectionForm_${tripId}_${formId}`
                localStorage.removeItem(cacheKey)
                const newIds = sectionFormIds.filter(id => id !== formId)
                setSectionFormIds(newIds)
              }}
            />
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  const insertIndex = sectionFormIds.indexOf(formId) + 1
                  const newIds = [...sectionFormIds]
                  newIds.splice(insertIndex, 0, nextFormId)
                  setSectionFormIds(newIds)
                  setNextFormId(nextFormId + 1)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add Section
              </button>
            </div>
          </div>
        ))}

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

function SectionForm({ formId, tripId, onClose }: { formId: number; tripId: string; onClose: () => void }) {
  const router = useRouter()
  const cacheKey = `sectionForm_${tripId}_${formId}`

  const [selectedCategory, setSelectedCategory] = useState<'travel' | 'activity' | 'stay' | null>(null)
  const [place, setPlace] = useState('')
  const [price, setPrice] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [isDateRange, setIsDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  // Travel-specific fields
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [selectedTransportMode, setSelectedTransportMode] = useState<string>('')

  // Load cached data on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined' || isLoaded) return

    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        setSelectedCategory(data.selectedCategory || null)
        setPlace(data.place || '')
        setPrice(data.price || '')
        setDateRange(data.dateRange || '')
        setIsDateRange(data.isDateRange || false)
        setStartDate(data.startDate || '')
        setEndDate(data.endDate || '')
        setFromLocation(data.fromLocation || '')
        setToLocation(data.toLocation || '')
        setSelectedTransportMode(data.selectedTransportMode || '')
      }
      setIsLoaded(true)
    } catch (error) {
      console.error('Error loading cached form data:', error)
      setIsLoaded(true)
    }
  }, [cacheKey, isLoaded])

  // Save to cache whenever form data changes (but only after initial load)
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return

    const formData = {
      selectedCategory,
      place,
      price,
      dateRange,
      isDateRange,
      startDate,
      endDate,
      fromLocation,
      toLocation,
      selectedTransportMode,
    }
    try {
      localStorage.setItem(cacheKey, JSON.stringify(formData))
    } catch (error) {
      console.error('Error saving form data to cache:', error)
    }
  }, [selectedCategory, place, price, dateRange, isDateRange, startDate, endDate, fromLocation, toLocation, selectedTransportMode, cacheKey, isLoaded])

  const categories = [
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'activity', name: 'Activity', icon: '🎯' },
    { id: 'stay', name: 'Stay', icon: '🏨' },
  ]

  const handleSearch = () => {
    if (!selectedCategory) return

    // Navigate to search page with query parameters
    const params = new URLSearchParams({
      tripId,
      formId: formId.toString(),
      category: selectedCategory,
      place,
      price: price || '',
      dateRange: isDateRange ? `${startDate}|${endDate}` : dateRange || '',
      from: fromLocation || '',
      to: toLocation || '',
      transportMode: selectedTransportMode || '',
    })
    router.push(`/trips/${tripId}/builder/search?${params.toString()}`)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 relative">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add Section</h2>

      {/* Category Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Category
        </label>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as 'travel' | 'activity' | 'stay')}
              className={`p-4 rounded-lg border-2 transition-all text-center ${selectedCategory === category.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {category.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form Fields - Only show after category is selected */}
      {selectedCategory && (
        <div className="space-y-4 mb-6">
          {/* Travel-specific fields */}
          {selectedCategory === 'travel' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From
                  </label>
                  <input
                    type="text"
                    placeholder="Enter origin location"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To
                  </label>
                  <input
                    type="text"
                    placeholder="Enter destination location"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transportation Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['flight', 'train', 'bus', 'car'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedTransportMode(mode)}
                      className={`px-4 py-2 rounded-md border-2 transition-all capitalize ${selectedTransportMode === mode
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Activity-specific field */}
          {selectedCategory === 'activity' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Activity Name
              </label>
              <input
                type="text"
                placeholder="Enter activity name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </div>
          )}

          {/* Stay category - show Place */}
          {selectedCategory === 'stay' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Place
              </label>
              <input
                type="text"
                placeholder="Enter place name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price
            </label>
            <input
              type="number"
              placeholder="Enter price"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <DateRangePicker
            startDate={startDate || ''}
            endDate={endDate || ''}
            onChange={(start, end) => {
              setStartDate(start)
              setEndDate(end)
              setIsDateRange(true)
            }}
            label="Date Range"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        {selectedCategory && (
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        )}
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
          onSelectActivity={(activityId: number | null, customName: string | null) => handleAddActivity(activityId, customName)}
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
            className={`p-2 border rounded cursor-pointer text-sm ${selectedActivity?.activity_id === activity.activity_id
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

