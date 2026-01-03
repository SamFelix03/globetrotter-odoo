'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateDDMMYYYY, formatDateRange } from '@/lib/dateUtils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Share2, Copy, Check } from 'lucide-react'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isSameMonth } from 'date-fns'

export default function TripViewPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const [trip, setTrip] = useState<any>(null)
  const [itinerary, setItinerary] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchTrip()
    fetchItinerary()
    fetchSections()
    fetchCurrentUser()
  }, [tripId])

  useEffect(() => {
    if (trip) {
      if (currentUser) {
        setIsOwner(trip.user_id === currentUser.user_id)
      }
      if (trip.is_public && trip.public_url_slug) {
        setShareLink(`${window.location.origin}/trips/public/${trip.public_url_slug}`)
      } else {
        setShareLink(window.location.href)
      }
      setCurrentMonth(new Date(trip.start_date))
    }
  }, [trip, currentUser])

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

  const fetchCurrentUser = async () => {
    try {
      const tripsRes = await fetch('/api/trips')
      const tripsData = await tripsRes.json()
      if (tripsData.trips && tripsData.trips.length > 0) {
        setCurrentUser({ user_id: tripsData.trips[0].users?.user_id || tripsData.trips[0].user_id || null })
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share && shareLink) {
      try {
        await navigator.share({
          title: trip.trip_name,
          text: trip.trip_description || `Check out my trip: ${trip.trip_name}`,
          url: shareLink,
        })
      } catch (error) {
        // User cancelled or error occurred
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyTrip = async () => {
    setCopying(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/copy`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/trips/${data.trip.trip_id}`)
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to copy trip')
      }
    } catch (error) {
      console.error('Error copying trip:', error)
      alert('Failed to copy trip')
    } finally {
      setCopying(false)
    }
  }

  const getActivitiesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const activities: any[] = []

    sections.forEach((section) => {
      let matchesDate = false

      if (section.is_date_range) {
        if (section.date_start && section.date_end) {
          const startDate = new Date(section.date_start)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(section.date_end)
          endDate.setHours(23, 59, 59, 999)
          const checkDate = new Date(date)
          checkDate.setHours(0, 0, 0, 0)
          if (checkDate >= startDate && checkDate <= endDate) {
            matchesDate = true
          }
        }
      } else if (section.date_single) {
        const singleDate = new Date(section.date_single)
        singleDate.setHours(0, 0, 0, 0)
        const checkDate = new Date(date)
        checkDate.setHours(0, 0, 0, 0)
        if (singleDate.getTime() === checkDate.getTime()) {
          matchesDate = true
        }
      }

      if (matchesDate) {
        if (section.category === 'activity') {
          activities.push({
            id: section.section_id,
            name: section.place || 'Activity',
            category: section.category,
            price: section.price,
          })
        } else if (section.category === 'travel') {
          activities.push({
            id: section.section_id,
            name: `${section.from_location || 'From'} → ${section.to_location || 'To'}`,
            category: section.category,
            transport_mode: section.transport_mode,
          })
        } else if (section.category === 'stay') {
          activities.push({
            id: section.section_id,
            name: section.place || 'Accommodation',
            category: section.category,
            price: section.price,
          })
        }
      }
    })

    itinerary.forEach((stop) => {
      stop.itinerary_days?.forEach((day: any) => {
        if (day.day_date === dateStr) {
          day.itinerary_activities?.forEach((activity: any) => {
            activities.push({
              ...activity,
              city: stop.cities?.city_name,
              type: 'legacy'
            })
          })
        }
      })
    })

    return activities
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
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {trip.trip_name}
              </h1>
              {trip.trip_description && (
                <p className="text-gray-600 mb-4">{trip.trip_description}</p>
              )}
              <div className="flex gap-6 text-sm text-gray-600">
                <span>
                  {formatDateRange(trip.start_date, trip.end_date)}
                </span>
                {trip.estimated_cost && (
                  <span>Estimated: ₹{trip.estimated_cost.toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </Button>
              {!isOwner && (
                <Button
                  variant="outline"
                  onClick={handleCopyTrip}
                  disabled={copying}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copying ? 'Copying...' : 'Copy Trip'}
                </Button>
              )}
            </div>
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
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Itinerary</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${viewMode === 'list' ? 'text-gray-900' : 'text-gray-500'}`}>
              List
            </span>
            <Switch
              checked={viewMode === 'calendar'}
              onCheckedChange={(checked) => setViewMode(checked ? 'calendar' : 'list')}
            />
            <span className={`text-sm font-medium ${viewMode === 'calendar' ? 'text-gray-900' : 'text-gray-500'}`}>
              Calendar
            </span>
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && sections.length > 0 && (
          <div className="mb-8">
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
                          ₹{section.price.toFixed(2)} {section.currency_code || 'INR'}
                        </p>
                      )}
                      {section.is_date_range ? (
                        section.date_start && section.date_end && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDateRange(section.date_start, section.date_end)}
                          </p>
                        )
                      ) : (
                        section.date_single && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDateDDMMYYYY(section.date_single)}
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
                          ₹{section.price.toFixed(2)} {section.currency_code || 'INR'}
                        </p>
                      )}
                      {section.date_single && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDateDDMMYYYY(section.date_single)}
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
                          ₹{section.price_per_night.toFixed(2)} {section.currency_code || 'INR'} per night
                        </p>
                      )}
                      {section.price && (
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          Total: ₹{section.price.toFixed(2)} {section.currency_code || 'INR'}
                        </p>
                      )}
                      {section.is_date_range ? (
                        section.date_start && section.date_end && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDateRange(section.date_start, section.date_end)}
                          </p>
                        )
                      ) : (
                        section.date_single && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDateDDMMYYYY(section.date_single)}
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

        {/* Calendar View */}
        {viewMode === 'calendar' && trip && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="mb-6 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                Previous
              </Button>
              <h3 className="text-xl font-semibold text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                Next
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map((day) => {
                const startDate = new Date(trip.start_date)
                const endDate = new Date(trip.end_date)
                const tripDays = eachDayOfInterval({ start: startDate, end: endDate })
                const isTripDay = tripDays.some((tripDay) => isSameDay(tripDay, day))
                const activities = isTripDay ? getActivitiesForDate(day) : []
                const isCurrentMonth = isSameMonth(day, currentMonth)

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-2 border rounded ${
                      isTripDay
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                  >
                    <div className={`text-sm font-medium ${isTripDay ? 'text-green-900' : 'text-gray-600'}`}>
                      {format(day, 'd')}
                    </div>
                    {activities.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {activities.slice(0, 2).map((activity, idx) => (
                          <div key={activity.id || idx} className="text-xs bg-white p-1 rounded truncate">
                            {activity.name || activity.activities?.activity_name || activity.custom_activity_name}
                          </div>
                        ))}
                        {activities.length > 2 && (
                          <div className="text-xs text-gray-500">+{activities.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Display Legacy Itinerary (if exists and no sections) */}
        {viewMode === 'list' && sections.length === 0 && itinerary.length > 0 && (
          <div className="space-y-8">
            {itinerary.map((stop: any) => (
              <div key={stop.stop_id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {stop.cities?.city_name}, {stop.cities?.country}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {formatDateRange(stop.arrival_date, stop.departure_date)}
                </p>

                {stop.itinerary_days && stop.itinerary_days.length > 0 && (
                  <div className="space-y-4">
                    {stop.itinerary_days.map((day: any) => (
                      <div key={day.day_id} className="border-l-2 border-green-800 pl-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Day {day.day_number} - {formatDateDDMMYYYY(day.day_date)}
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
        {viewMode === 'list' && sections.length === 0 && itinerary.length === 0 && (
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

