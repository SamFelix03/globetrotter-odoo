'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploadModal from '@/components/ImageUploadModal'
import DateRangePicker from '@/components/DateRangePicker'

export default function CreateTripPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    trip_name: '',
    trip_description: '',
    start_date: '',
    end_date: '',
    cover_photo_url: '',
    total_budget: '',
    is_public: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_budget: formData.total_budget ? parseFloat(formData.total_budget) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create trip')
        setLoading(false)
        return
      }

      router.push(`/trips/${data.trip.trip_id}/builder`)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Create New Trip</h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="trip_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trip Name *
            </label>
            <input
              type="text"
              id="trip_name"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={formData.trip_name}
              onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="trip_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="trip_description"
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={formData.trip_description}
              onChange={(e) => setFormData({ ...formData, trip_description: e.target.value })}
            />
          </div>

          <DateRangePicker
            startDate={formData.start_date}
            endDate={formData.end_date}
            onChange={(start, end) => {
              setFormData({ ...formData, start_date: start, end_date: end })
            }}
            label="Trip Dates"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Photo
            </label>
            {formData.cover_photo_url && (
              <div className="mb-3">
                <img
                  src={formData.cover_photo_url}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {formData.cover_photo_url ? 'Change Photo' : 'Upload Photo'}
              </button>
              {formData.cover_photo_url && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, cover_photo_url: '' })}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="total_budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Budget (USD)
            </label>
            <input
              type="number"
              id="total_budget"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={formData.total_budget}
              onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
            />
            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Make this trip public
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onUploadSuccess={(url) => {
          setFormData({ ...formData, cover_photo_url: url })
          setShowImageModal(false)
        }}
        folder="trips"
        currentImageUrl={formData.cover_photo_url}
        title="Upload Trip Cover Photo"
      />
    </div>
  )
}

