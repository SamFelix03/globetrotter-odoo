'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateDDMMYYYY, formatDateRange } from '@/lib/dateUtils'
import { ChevronDown, ChevronUp, MessageCircle, Calendar, MapPin, DollarSign } from 'lucide-react'

export default function CommunityPage() {
  const router = useRouter()
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedComment, setExpandedComment] = useState<number | null>(null)
  const [expandedTripData, setExpandedTripData] = useState<any>(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [userTrips, setUserTrips] = useState<any[]>([])
  const [selectedTrip, setSelectedTrip] = useState('')
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetchComments()
    fetchUserTrips()
  }, [])

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/community/comments')
      const data = await res.json()
      setComments(data.comments || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching comments:', error)
      setLoading(false)
    }
  }

  const fetchUserTrips = async () => {
    try {
      const res = await fetch('/api/trips')
      const data = await res.json()
      setUserTrips(data.trips || [])
    } catch (error) {
      console.error('Error fetching user trips:', error)
    }
  }

  const handleExpandComment = async (commentId: number) => {
    if (expandedComment === commentId) {
      setExpandedComment(null)
      setExpandedTripData(null)
      return
    }

    setExpandedComment(commentId)
    try {
      const res = await fetch(`/api/community/comments/${commentId}`)
      const data = await res.json()
      setExpandedTripData(data.comment)
    } catch (error) {
      console.error('Error fetching comment details:', error)
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrip || !commentText.trim()) {
      alert('Please select a trip and enter a comment')
      return
    }

    setPosting(true)
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: selectedTrip,
          comment_text: commentText,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to post comment')
        setPosting(false)
        return
      }

      // Reset form and refresh comments
      setCommentText('')
      setSelectedTrip('')
      setShowPostForm(false)
      fetchComments()
      setPosting(false)
    } catch (error: any) {
      alert(`Error posting comment: ${error.message}`)
      setPosting(false)
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
          <p className="text-gray-600">Share your travel experiences and discover amazing trips from others</p>
        </div>

        {/* Post Comment Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            className="px-6 py-3 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors"
          >
            {showPostForm ? 'Cancel' : '+ Share Your Trip'}
          </button>
        </div>

        {/* Post Comment Form */}
        {showPostForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Share a Trip</h2>
            <form onSubmit={handlePostComment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Trip
                </label>
                <select
                  value={selectedTrip}
                  onChange={(e) => setSelectedTrip(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800"
                  required
                >
                  <option value="">Choose a trip...</option>
                  {userTrips.map((trip) => (
                    <option key={trip.trip_id} value={trip.trip_id}>
                      {trip.trip_name} ({formatDateRange(trip.start_date, trip.end_date)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Comment
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800"
                  placeholder="Share your experience, tips, or highlights from this trip..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={posting}
                className="px-6 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Posting...' : 'Post to Community'}
              </button>
            </form>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No community posts yet.</p>
              <p className="text-gray-500">Be the first to share your travel experience!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.comment_id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                {/* Comment Header */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => handleExpandComment(comment.comment_id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {comment.user?.profile_photo_url ? (
                        <img
                          src={comment.user.profile_photo_url}
                          alt={comment.user.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-800 flex items-center justify-center text-white font-semibold">
                          {comment.user?.full_name?.charAt(0) || comment.user?.email?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {comment.user?.full_name || comment.user?.email?.split('@')[0] || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDateDDMMYYYY(comment.created_at)}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      {expandedComment === comment.comment_id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Comment Text */}
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{comment.comment_text}</p>

                  {/* Trip Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{comment.trip?.trip_name}</h4>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {comment.trip?.start_date && comment.trip?.end_date && (
                          <>
                            {formatDateRange(comment.trip.start_date, comment.trip.end_date)}
                          </>
                        )}
                      </span>
                      {comment.trip?.estimated_cost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{comment.trip.estimated_cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Trip Details */}
                {expandedComment === comment.comment_id && expandedTripData && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {expandedTripData.trip?.trip_name}
                      </h3>
                      {expandedTripData.trip?.trip_description && (
                        <p className="text-gray-600 mb-4">{expandedTripData.trip.trip_description}</p>
                      )}
                      {expandedTripData.trip?.cover_photo_url && (
                        <img
                          src={expandedTripData.trip.cover_photo_url}
                          alt={expandedTripData.trip.trip_name}
                          className="w-full h-64 object-cover rounded-lg mb-4"
                        />
                      )}
                    </div>

                    {/* Trip Sections */}
                    {expandedTripData.trip?.sections && expandedTripData.trip.sections.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xl font-semibold text-gray-900 mb-4">Itinerary</h4>
                        <div className="space-y-4">
                          {expandedTripData.trip.sections.map((section: any, index: number) => (
                            <div key={section.section_id} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 font-semibold">
                                  {index + 1}
                                </span>
                                <span className="px-3 py-1 rounded-full text-sm font-medium capitalize bg-blue-100 text-blue-800">
                                  {section.category}
                                </span>
                              </div>

                              {/* Travel Section */}
                              {section.category === 'travel' && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">
                                      {section.from_location || 'From'} → {section.to_location || 'To'}
                                    </span>
                                    {section.transport_mode && (
                                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 capitalize">
                                        {section.transport_mode}
                                      </span>
                                    )}
                                  </div>
                                  {section.price && (
                                    <p className="text-green-600 font-semibold">
                                      ₹{section.price.toFixed(2)} {section.currency_code || 'INR'}
                                    </p>
                                  )}
                                  {section.is_date_range ? (
                                    section.date_start && section.date_end && (
                                      <p className="text-sm text-gray-600">
                                        {formatDateRange(section.date_start, section.date_end)}
                                      </p>
                                    )
                                  ) : (
                                    section.date_single && (
                                      <p className="text-sm text-gray-600">
                                        {formatDateDDMMYYYY(section.date_single)}
                                      </p>
                                    )
                                  )}
                                </div>
                              )}

                              {/* Activity Section */}
                              {section.category === 'activity' && (
                                <div className="space-y-2">
                                  <h5 className="font-semibold text-gray-900">
                                    {section.place || 'Activity'}
                                  </h5>
                                  {section.price && (
                                    <p className="text-green-600 font-semibold">
                                      ₹{section.price.toFixed(2)} {section.currency_code || 'INR'}
                                    </p>
                                  )}
                                  {section.date_single && (
                                    <p className="text-sm text-gray-600">
                                      {formatDateDDMMYYYY(section.date_single)}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Stay Section */}
                              {section.category === 'stay' && (
                                <div className="space-y-2">
                                  <h5 className="font-semibold text-gray-900">
                                    {section.place || 'Accommodation'}
                                  </h5>
                                  {section.price_per_night && (
                                    <p className="text-sm text-gray-600">
                                      ₹{section.price_per_night.toFixed(2)} {section.currency_code || 'INR'} per night
                                    </p>
                                  )}
                                  {section.price && (
                                    <p className="text-green-600 font-semibold">
                                      Total: ₹{section.price.toFixed(2)} {section.currency_code || 'INR'}
                                    </p>
                                  )}
                                  {section.is_date_range ? (
                                    section.date_start && section.date_end && (
                                      <p className="text-sm text-gray-600">
                                        {formatDateRange(section.date_start, section.date_end)}
                                      </p>
                                    )
                                  ) : (
                                    section.date_single && (
                                      <p className="text-sm text-gray-600">
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

                    {/* View Full Trip Link */}
                    <Link
                      href={`/trips/${expandedTripData.trip?.trip_id}`}
                      className="inline-block px-6 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors"
                    >
                      View Full Trip Details
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

