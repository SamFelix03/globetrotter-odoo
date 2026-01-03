'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, DollarSign, MapPin, Sparkles, Loader2 } from 'lucide-react'
import { formatDateDDMMYYYY } from '@/lib/dateUtils'

export default function AITripPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destination = searchParams.get('destination') || ''
  const imageUrl = searchParams.get('imageUrl') || ''

  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [userState, setUserState] = useState<string>('')

  // Get user's state from cookie
  useEffect(() => {
    const getStateFromCookie = () => {
      const stateCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_state='))
        ?.split('=')[1]
      
      if (stateCookie) {
        setUserState(decodeURIComponent(stateCookie))
      } else {
        // Try to get location if not stored
        getUserState()
      }
    }
    getStateFromCookie()
  }, [])

  const getUserState = () => {
    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          )
          const data = await response.json()
          const state = data.principalSubdivision || data.administrativeArea || ''
          
          if (state) {
            setUserState(state)
            document.cookie = `user_state=${encodeURIComponent(state)}; path=/; max-age=${365 * 24 * 60 * 60}`
          }
        } catch (error) {
          console.error('Error getting state from location:', error)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
      }
    )
  }

  const handleGeneratePlan = async () => {
    if (!budget || !startDate || !endDate) {
      setError('Please fill in all fields')
      return
    }

    if (parseFloat(budget) <= 0) {
      setError('Budget must be greater than 0')
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date')
      return
    }

    setError('')
    setIsGenerating(true)

    try {
      // Call AI planning API
      const response = await fetch('/api/trips/ai-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination,
          budget: parseFloat(budget),
          startDate,
          endDate,
          originState: userState,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate trip plan')
      }

      // Redirect to builder page with the created trip ID
      router.push(`/trips/${data.tripId}/builder`)
    } catch (err: any) {
      setError(err.message || 'Failed to generate trip plan. Please try again.')
      setIsGenerating(false)
    }
  }

  // Set default dates (today and 7 days from today)
  useEffect(() => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    if (!startDate) {
      setStartDate(formatDateForInput(today))
    }
    if (!endDate) {
      setEndDate(formatDateForInput(nextWeek))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-green-800" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Trip Planner
          </h1>
          <p className="text-gray-600">
            Let AI create a complete itinerary for your trip
          </p>
        </div>

        {/* Destination Card */}
        {destination && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="h-48 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={destination}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/trip-default-img.png'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-green-800" />
                <h2 className="text-2xl font-bold text-gray-900">{destination}</h2>
              </div>
              <p className="text-gray-600">
                We'll create a personalized itinerary with activities, accommodations, and travel options.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Trip Details
          </h3>

          <div className="space-y-6">
            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Total Budget (INR)
              </label>
              <input
                type="number"
                placeholder="Enter your budget"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
                step="0.01"
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500 mt-1">
                This budget will be distributed across accommodations, activities, and transportation
              </p>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Trip Duration
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={isGenerating}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    disabled={isGenerating}
                  />
                </div>
              </div>
              {startDate && endDate && (
                <p className="text-xs text-gray-500 mt-2">
                  Duration: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating || !budget || !startDate || !endDate}
              className="w-full px-6 py-4 bg-green-800 text-white font-semibold rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Your Trip Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate AI Trip Plan
                </>
              )}
            </button>

            {isGenerating && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  This may take a minute. We're creating a personalized itinerary for you...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            disabled={isGenerating}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

