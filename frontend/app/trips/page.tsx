'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ConfirmModal'
import { formatDateDDMMYYYY, formatDateRange } from '@/lib/dateUtils'

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tripId: number | null; tripName: string }>({
    isOpen: false,
    tripId: null,
    tripName: '',
  })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const res = await fetch('/api/trips')
      const data = await res.json()
      setTrips(data.trips || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching trips:', error)
      setLoading(false)
    }
  }

  const handleDeleteClick = (tripId: number, tripName: string) => {
    setDeleteModal({ isOpen: true, tripId, tripName })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.tripId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/trips/${deleteModal.tripId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchTrips()
        setDeleteModal({ isOpen: false, tripId: null, tripName: '' })
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete trip')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('An error occurred while deleting the trip')
    } finally {
      setDeleting(false)
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
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <Link
            href="/trips/create"
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-800 hover:bg-green-900"
          >
            + New Trip
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">
              You haven't created any trips yet.
            </p>
            <Link
              href="/trips/create"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-800 hover:bg-green-900"
            >
              Plan Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.trip_id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <img
                  src={trip.cover_photo_url || '/trip-default-img.png'}
                  alt={trip.trip_name}
                  className="w-full h-48 object-cover rounded-t-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/trip-default-img.png'
                  }}
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {trip.trip_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </p>
                  {trip.trip_description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {trip.trip_description}
                    </p>
                  )}
                  {trip.estimated_cost && (
                    <p className="text-sm font-medium text-gray-900 mb-4">
                      Estimated: ₹{trip.estimated_cost.toFixed(2)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href={`/trips/${trip.trip_id}`}
                      className="flex-1 text-center px-4 py-2 text-sm font-medium text-green-800 hover:text-green-900"
                    >
                      View
                    </Link>
                    <Link
                      href={`/trips/${trip.trip_id}/builder`}
                      className="flex-1 text-center px-4 py-2 text-sm font-medium text-green-800 hover:text-green-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(trip.trip_id, trip.trip_name)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, tripId: null, tripName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Trip"
        message={`Are you sure you want to delete "${deleteModal.tripName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

