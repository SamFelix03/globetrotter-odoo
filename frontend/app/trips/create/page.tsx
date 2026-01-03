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
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Trip</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="trip_name" className="block text-sm font-medium text-gray-700">
              Trip Name *
            </label>
            <input
              type="text"
              id="trip_name"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-800 focus:border-green-800 bg-white text-gray-900"
              value={formData.trip_name}
              onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="trip_description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="trip_description"
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-800 focus:border-green-800 bg-white text-gray-900"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Photo
            </label>
            {formData.cover_photo_url && (
              <div className="mb-3">
                <img
                  src={formData.cover_photo_url}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="px-4 py-2 text-sm font-medium text-green-800 border border-green-800 rounded-md hover:bg-green-50"
              >
                {formData.cover_photo_url ? 'Change Photo' : 'Upload Photo'}
              </button>
              {formData.cover_photo_url && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, cover_photo_url: '' })}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="total_budget" className="block text-sm font-medium text-gray-700">
              Total Budget (INR)
            </label>
            <input
              type="number"
              id="total_budget"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-800 focus:border-green-800 bg-white text-gray-900"
              value={formData.total_budget}
              onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              className="h-4 w-4 text-green-800 focus:ring-green-800 border-gray-300 rounded"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
            />
            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
              Make this trip public
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-800 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-800 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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

