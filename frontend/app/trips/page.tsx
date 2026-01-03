'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ConfirmModal'
import { formatDateDDMMYYYY, formatDateRange } from '@/lib/dateUtils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Calendar, DollarSign, Eye, Edit, Trash2 } from 'lucide-react'

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
            <p className="text-gray-600 mt-1">Manage and organize your travel plans</p>
          </div>
          <Link href="/trips/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </Button>
          </Link>
        </div>

        {trips.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4 text-lg">
                You haven't created any trips yet.
              </p>
              <p className="text-gray-400 mb-6">
                Start planning your first adventure by creating a new trip.
              </p>
              <Link href="/trips/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Plan Your First Trip
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card
                key={trip.trip_id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={trip.cover_photo_url || '/trip-default-img.png'}
                    alt={trip.trip_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/trip-default-img.png'
                    }}
                  />
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{trip.trip_name}</CardTitle>
                  {trip.trip_description && (
                    <CardDescription className="line-clamp-2">
                      {trip.trip_description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {trip.estimated_cost && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">${trip.estimated_cost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/trips/${trip.trip_id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link
                      href={`/trips/${trip.trip_id}/builder`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteClick(trip.trip_id, trip.trip_name)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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

