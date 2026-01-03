'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isSameMonth } from 'date-fns'
import { formatDateDDMMYYYY } from '@/lib/dateUtils'

export default function CalendarPage() {
  const params = useParams()
  const tripId = params.tripId as string
  const [trip, setTrip] = useState<any>(null)
  const [sections, setSections] = useState<any[]>([])
  const [itinerary, setItinerary] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrip()
    fetchSections()
    fetchItinerary()
  }, [tripId])

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`)
      const data = await res.json()
      setTrip(data.trip)
      if (data.trip) {
        setCurrentMonth(new Date(data.trip.start_date))
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching trip:', error)
      setLoading(false)
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

  const fetchItinerary = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`)
      const data = await res.json()
      setItinerary(data.itinerary || [])
    } catch (error) {
      console.error('Error fetching itinerary:', error)
    }
  }

  const getActivitiesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const activities: any[] = []

    // First, check new sections (trip_sections)
    sections.forEach((section) => {
      let matchesDate = false

      if (section.is_date_range) {
        // Check if date falls within the date range
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
        // Check if date matches single date
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
            type: 'section'
          })
        } else if (section.category === 'travel') {
          activities.push({
            id: section.section_id,
            name: `${section.from_location || 'From'} → ${section.to_location || 'To'}`,
            category: section.category,
            transport_mode: section.transport_mode,
            type: 'section'
          })
        } else if (section.category === 'stay') {
          activities.push({
            id: section.section_id,
            name: section.place || 'Accommodation',
            category: section.category,
            price: section.price,
            type: 'section'
          })
        }
      }
    })

    // Also include legacy itinerary activities for backward compatibility
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

  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const tripDays = eachDayOfInterval({ start: startDate, end: endDate })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/trips/${tripId}`} className="text-green-800 hover:text-green-900">
            ← Back to Trip
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Trip Calendar</h1>

          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Previous
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day) => {
              const isTripDay = tripDays.some((tripDay) => isSameDay(tripDay, day))
              const activities = isTripDay ? getActivitiesForDate(day) : []
              const isCurrentMonth = isSameMonth(day, currentMonth)

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 p-2 border rounded ${isTripDay
                    ? 'bg-green-50 dark:bg-blue-900/20 border-green-300 dark:border-blue-700'
                    : 'bg-gray-50 border-gray-200'
                    } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                >
                  <div className={`text-sm font-medium ${isTripDay ? 'text-green-900 dark:text-blue-300' : 'text-gray-600'}`}>
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

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline View</h2>
          <div className="space-y-4">
            {tripDays.map((day) => {
              const activities = getActivitiesForDate(day)
              return (
                <div key={day.toISOString()} className="border-l-2 border-green-800 pl-4">
                  <div className="font-semibold text-gray-900">
                    {formatDateDDMMYYYY(day)}
                  </div>
                  {activities.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {activities.map((activity, idx) => (
                        <div key={activity.id || idx} className="text-sm text-gray-600">
                          {activity.start_time && activity.end_time && (
                            <span className="font-medium">
                              {activity.start_time} - {activity.end_time}:{' '}
                            </span>
                          )}
                          <span className="capitalize text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 mr-2">
                            {activity.category || 'activity'}
                          </span>
                          {activity.name || activity.activities?.activity_name || activity.custom_activity_name}
                          {activity.city && (
                            <span className="ml-2 text-gray-500">({activity.city})</span>
                          )}
                          {activity.transport_mode && (
                            <span className="ml-2 text-gray-500">via {activity.transport_mode}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic mt-2">No activities planned</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

