'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Loader2, ArrowLeft } from 'lucide-react'
import { formatDateDDMMYYYY } from '@/lib/dateUtils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

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
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={isGenerating}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="shadow-lg border-gray-100">
          <CardHeader className="space-y-4">
            <CardTitle className="text-4xl font-bold tracking-tight text-green-900">
              AI Trip Planner
            </CardTitle>
            <CardDescription className="text-base">
              Let AI create a complete itinerary for your trip
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 md:p-10">
            {/* Destination Card */}
            {destination && (
              <div className="mb-8 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
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

            <FieldGroup className="gap-8">
              {error && (
                <FieldError className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-base">
                  {error}
                </FieldError>
              )}

              <FieldSet className="gap-8">
                <Field>
                  <FieldLabel htmlFor="budget" className="text-lg font-medium text-gray-700 mb-2">
                    Total Budget (INR) *
                  </FieldLabel>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Enter your budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={isGenerating}
                    className="text-lg py-6 px-4"
                  />
                  <FieldDescription className="text-sm mt-2">
                    This budget will be distributed across accommodations, activities, and transportation
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel className="text-lg font-medium text-gray-700 mb-2">
                    Trip Duration *
                  </FieldLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Start Date</label>
                      <Input
                        type="date"
                        className="text-lg py-6 px-4"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        disabled={isGenerating}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">End Date</label>
                      <Input
                        type="date"
                        className="text-lg py-6 px-4"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                  {startDate && endDate && (
                    <FieldDescription className="text-sm mt-2">
                      Duration: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </FieldDescription>
                  )}
                </Field>

                <div className="pt-4">
                  <Button
                    onClick={handleGeneratePlan}
                    disabled={isGenerating || !budget || !startDate || !endDate}
                    className="w-full px-6 py-6 text-lg font-semibold bg-green-800 hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating Your Trip Plan...
                      </>
                    ) : (
                      'Generate AI Trip Plan'
                    )}
                  </Button>
                </div>

                {isGenerating && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-600">
                      This may take a minute. We're creating a personalized itinerary for you...
                    </p>
                  </div>
                )}
              </FieldSet>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

