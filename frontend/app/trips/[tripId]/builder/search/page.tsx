'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function BuilderSearchPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = params.tripId as string
  
  const category = searchParams.get('category') as 'travel' | 'activity' | 'stay' | null
  const place = searchParams.get('place') || ''
  const price = searchParams.get('price') || ''
  const dateRange = searchParams.get('dateRange') || ''

  const categories = [
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'activity', name: 'Activity', icon: '🎯' },
    { id: 'stay', name: 'Stay', icon: '🏨' },
  ]

  const selectedCategory = categories.find(c => c.id === category)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href={`/trips/${tripId}/builder`} 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Builder
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Search {selectedCategory?.name || 'Options'}
          </h1>
          
          {selectedCategory && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">{selectedCategory.icon}</span>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {selectedCategory.name}
              </span>
            </div>
          )}
          
          {place && (
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Place:</span> {place}
            </div>
          )}
          {price && (
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Price:</span> ${price}
            </div>
          )}
          {dateRange && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Date:</span> {dateRange.includes('|') ? dateRange.split('|').join(' - ') : dateRange}
            </div>
          )}
        </div>

        {selectedCategory && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Search Results for {selectedCategory.name}
            </h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Search functionality for {selectedCategory.name.toLowerCase()} will be implemented in the next step.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

