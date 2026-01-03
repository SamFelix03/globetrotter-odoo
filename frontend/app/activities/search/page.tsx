'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ActivitySearchPage() {
  const searchParams = useSearchParams()
  const cityId = searchParams.get('city_id')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [activities, setActivities] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
    if (cityId) {
      fetchActivities()
    }
  }, [cityId])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/activities/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchActivities = async () => {
    setLoading(true)
    try {
      let url = '/api/activities?'
      if (cityId) url += `city_id=${cityId}&`
      if (search) url += `search=${encodeURIComponent(search)}&`
      if (categoryId) url += `category_id=${categoryId}&`
      url += 'limit=50'

      const res = await fetch(url)
      const data = await res.json()
      setActivities(data.activities || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching activities:', error)
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchActivities()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Search Activities</h1>

        <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search activities..."
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <div
                key={activity.activity_id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {activity.activity_name}
                </h3>
                {activity.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
                    {activity.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {activity.estimated_cost && (
                    <span>${activity.estimated_cost}</span>
                  )}
                  {activity.estimated_duration && (
                    <span>{activity.estimated_duration} min</span>
                  )}
                </div>
                {activity.booking_url && (
                  <a
                    href={activity.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                  >
                    Book Now →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

