'use client'

import { useEffect, useState } from 'react'
import { formatDateDDMMYYYY } from '@/lib/dateUtils'

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) {
        if (res.status === 403) {
          alert('You are not authorized to access this page')
          window.location.href = '/dashboard'
          return
        }
      }
      const data = await res.json()
      setAnalytics(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics:', error)
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

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Unable to load analytics</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.stats.total_users}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Trips</div>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.stats.total_trips}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Cities</div>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.stats.total_cities}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Activities</div>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.stats.total_activities}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Public Trips</div>
            <div className="text-3xl font-bold text-gray-900">
              {analytics.stats.public_trips}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Cities</h2>
            <div className="space-y-2">
              {analytics.popular_cities?.map((city: any, index: number) => (
                <div key={city.city_id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {index + 1}. {city.city_name}
                    </div>
                    <div className="text-sm text-gray-600">{city.country}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {city.popularity_score} trips
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Trips</h2>
            <div className="space-y-2">
              {analytics.recent_trips?.map((trip: any) => (
                <div key={trip.trip_id}>
                  <div className="font-medium text-gray-900">{trip.trip_name}</div>
                  <div className="text-sm text-gray-600">
                    by {trip.users?.full_name || 'Unknown'} • {formatDateDDMMYYYY(trip.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

