'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateDDMMYYYY } from '@/lib/dateUtils'
import AISearchModal from '@/components/AISearchModal'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, X } from 'lucide-react'

export default function ItineraryBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string
  const [trip, setTrip] = useState<any>(null)
  const [stops, setStops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize form IDs from cache synchronously if available
  const getInitialFormIds = () => {
    if (typeof window === 'undefined') return []
    try {
      const cachedIds = localStorage.getItem(`sectionFormIds_${tripId}`)
      if (cachedIds) {
        const ids = JSON.parse(cachedIds)
        if (Array.isArray(ids) && ids.length > 0) {
          return ids
        }
      }
    } catch (error) {
      console.error('Error loading cached form IDs:', error)
    }
    return []
  }

  const getInitialNextFormId = () => {
    if (typeof window === 'undefined') return 1
    try {
      const cachedNextId = localStorage.getItem(`nextFormId_${tripId}`)
      if (cachedNextId) {
        const nextId = parseInt(cachedNextId, 10)
        if (!isNaN(nextId)) {
          return nextId
        }
      }
    } catch (error) {
      console.error('Error loading cached next form ID:', error)
    }
    return 1
  }

  const [sectionFormIds, setSectionFormIds] = useState<number[]>(getInitialFormIds)
  const [nextFormId, setNextFormId] = useState(getInitialNextFormId)
  const [saving, setSaving] = useState(false)
  const [savedSections, setSavedSections] = useState<any[]>([])
  const [newlyAddedSectionId, setNewlyAddedSectionId] = useState<number | null>(null)

  // Save form IDs to cache whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`sectionFormIds_${tripId}`, JSON.stringify(sectionFormIds))
      localStorage.setItem(`nextFormId_${tripId}`, nextFormId.toString())
    }
  }, [sectionFormIds, nextFormId, tripId])

  // Load saved sections on mount
  useEffect(() => {
    fetchSections()
  }, [tripId])

  const fetchSections = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/sections`)
      const data = await res.json()
      if (data.sections) {
        setSavedSections(data.sections)
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const handleSaveAllSections = async () => {
    setSaving(true)
    try {
      // Collect all section data from localStorage
      const sections: any[] = []

      for (const formId of sectionFormIds) {
        const cacheKey = `sectionForm_${tripId}_${formId}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const formData = JSON.parse(cached)

          // Only save if category is selected (section is started)
          if (formData.selectedCategory) {
            // Validate date range - if is_date_range is true, both start and end dates must be present
            if (formData.is_date_range) {
              if (!formData.startDate || !formData.endDate) {
                alert(`Section with category "${formData.selectedCategory}" has date range selected but is missing start or end date. Please fill both dates.`)
                setSaving(false)
                return
              }
            }

            const section: any = {
              category: formData.selectedCategory,
              place: formData.place || null,
              price: formData.price || null,
              currency_code: 'INR',
              is_date_range: formData.is_date_range || false,
            }

            // Date handling
            if (formData.is_date_range) {
              section.date_start = formData.startDate || null
              section.date_end = formData.endDate || null
              section.date_single = null
            } else {
              section.date_single = formData.dateRange || null
              section.date_start = null
              section.date_end = null
            }

            // Category-specific fields
            if (formData.selectedCategory === 'travel') {
              section.from_location = formData.fromLocation || null
              section.to_location = formData.toLocation || null
              section.transport_mode = formData.selectedTransportMode || null
            } else if (formData.selectedCategory === 'activity') {
              section.activity_theme = null // Could be stored in metadata if needed
            } else if (formData.selectedCategory === 'stay') {
              section.price_per_night = formData.pricePerNight || null
            }

            sections.push(section)
          }
        }
      }

      // Save all sections using bulk endpoint
      const res = await fetch(`/api/trips/${tripId}/sections/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(`Error saving sections: ${data.error}`)
        setSaving(false)
        return
      }

      // Refresh saved sections
      await fetchSections()

      // Redirect to trips page after successful save
      window.location.href = '/trips'
    } catch (error: any) {
      console.error('Error saving sections:', error)
      alert(`Error saving sections: ${error.message}`)
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchTrip()
    fetchStops()
  }, [tripId])

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`)
      const data = await res.json()
      setTrip(data.trip)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching trip:', error)
      setLoading(false)
    }
  }

  const fetchStops = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/stops`)
      const data = await res.json()
      setStops(data.stops || [])
    } catch (error) {
      console.error('Error fetching stops:', error)
    }
  }


  const handleDeleteStop = async (stopId: number) => {
    if (!confirm('Are you sure you want to delete this stop?')) return

    try {
      const res = await fetch(`/api/trips/${tripId}/stops/${stopId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchStops()
      }
    } catch (error) {
      console.error('Error deleting stop:', error)
    }
  }

  if (loading || saving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mb-4"></div>
          <div className="text-lg text-gray-600">
            {saving ? 'Saving your trip...' : 'Loading...'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/trips/${tripId}`} className="text-green-800 hover:text-green-900">
            ← Back to Trip
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Itinerary Builder: {trip?.trip_name}
          </h1>
        </div>

        {/* Sections with chain UI */}
        <div className="space-y-0">
          {sectionFormIds.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center mb-8">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🗺️</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Start Building Your Itinerary
                </h2>
                <p className="text-gray-600 mb-6">
                  Add your first section to begin planning your trip
                </p>
                <Button
                  onClick={() => {
                    const newId = nextFormId
                    setSectionFormIds([...sectionFormIds, newId])
                    setNextFormId(newId + 1)
                    setNewlyAddedSectionId(newId)
                    setTimeout(() => setNewlyAddedSectionId(null), 2000)
                  }}
                  className="px-8 py-6 text-lg font-semibold bg-green-800 hover:bg-green-900"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Section
                </Button>
              </div>
            </div>
          ) : (
            sectionFormIds.map((formId, index) => (
              <div 
                key={formId} 
                className={`relative ${newlyAddedSectionId === formId ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : ''}`}
              >
                {/* Section Form */}
                <div className={`relative mb-0 ${newlyAddedSectionId === formId ? 'ring-4 ring-green-400 ring-opacity-50 rounded-lg' : ''}`}>
                  <SectionForm
                    formId={formId}
                    tripId={tripId}
                    sectionNumber={index + 1}
                    onClose={() => {
                      // Clear cache when closing
                      const cacheKey = `sectionForm_${tripId}_${formId}`
                      localStorage.removeItem(cacheKey)
                      const newIds = sectionFormIds.filter(id => id !== formId)
                      setSectionFormIds(newIds)
                    }}
                  />
                </div>

                {/* Add Section Button - below each section */}
                <div className="flex items-center justify-center my-6">
                  <button
                    onClick={() => {
                      const insertIndex = index + 1
                      const newId = nextFormId
                      const newIds = [...sectionFormIds]
                      newIds.splice(insertIndex, 0, newId)
                      setSectionFormIds(newIds)
                      setNextFormId(newId + 1)
                      setNewlyAddedSectionId(newId)
                      setTimeout(() => setNewlyAddedSectionId(null), 2000)
                    }}
                    className="w-10 h-10 rounded-full bg-green-800 hover:bg-green-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all border-2 border-white"
                    title="Add section here"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Save Trip Button at the end */}
        {sectionFormIds.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSaveAllSections}
              disabled={saving}
              className="px-8 py-6 text-lg font-semibold bg-green-800 hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Trip'}
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {stops.map((stop, index) => (
            <StopBuilder
              key={stop.stop_id}
              stop={stop}
              tripId={tripId}
              onDelete={() => handleDeleteStop(stop.stop_id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionForm({ formId, tripId, sectionNumber, onClose }: { formId: number; tripId: string; sectionNumber: number; onClose: () => void }) {
  const router = useRouter()
  const cacheKey = `sectionForm_${tripId}_${formId}`

  // Helper function to calculate nights between two dates
  const calculateNights = (start: string, end: string): number => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Phase management
  const [currentPhase, setCurrentPhase] = useState(1) // 1: Category, 2: Manual/AI choice, 3: Form
  const [selectedCategory, setSelectedCategory] = useState<'travel' | 'activity' | 'stay' | null>(null)
  const [entryMethod, setEntryMethod] = useState<'manual' | 'ai' | null>(null) // 'manual' or 'ai'
  const [showAIModal, setShowAIModal] = useState(false)
  
  const [place, setPlace] = useState('')
  const [price, setPrice] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [isDateRange, setIsDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  // Travel-specific fields
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [selectedTransportMode, setSelectedTransportMode] = useState<string>('')
  // Store price per night for Stay category to recalculate when dates change
  const [pricePerNight, setPricePerNight] = useState<number | null>(null)

  // Load cached data on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined' || isLoaded) return

    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        setSelectedCategory(data.selectedCategory || null)
        setEntryMethod(data.entryMethod || null)
        setCurrentPhase(data.currentPhase || 1)
        setPlace(data.place || '')
        setPrice(data.price || '')
        setDateRange(data.dateRange || '')
        setIsDateRange(data.isDateRange || false)
        setStartDate(data.startDate || '')
        setEndDate(data.endDate || '')
        setFromLocation(data.fromLocation || '')
        setToLocation(data.toLocation || '')
        setSelectedTransportMode(data.selectedTransportMode || '')
        // Restore price per night for Stay category
        if (data.pricePerNight && data.selectedCategory === 'stay') {
          setPricePerNight(data.pricePerNight)
        }
      }
      setIsLoaded(true)
    } catch (error) {
      console.error('Error loading cached form data:', error)
      setIsLoaded(true)
    }
  }, [cacheKey, isLoaded])

  // Save to cache whenever form data changes (but only after initial load)
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return

    const formData = {
      currentPhase,
      selectedCategory,
      entryMethod,
      place,
      price,
      dateRange,
      isDateRange,
      startDate,
      endDate,
      fromLocation,
      toLocation,
      selectedTransportMode,
      pricePerNight: selectedCategory === 'stay' ? pricePerNight : null,
    }
    try {
      localStorage.setItem(cacheKey, JSON.stringify(formData))
    } catch (error) {
      console.error('Error saving form data to cache:', error)
    }
  }, [currentPhase, selectedCategory, entryMethod, place, price, dateRange, isDateRange, startDate, endDate, fromLocation, toLocation, selectedTransportMode, cacheKey, isLoaded, pricePerNight])

  const categories = [
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'activity', name: 'Activity', icon: '🎯' },
    { id: 'stay', name: 'Stay', icon: '🏨' },
  ]

  // Function to clear all form state
  const clearFormState = () => {
    setCurrentPhase(1)
    setSelectedCategory(null)
    setEntryMethod(null)
    setPlace('')
    setPrice('')
    setDateRange('')
    setIsDateRange(false)
    setStartDate('')
    setEndDate('')
    setFromLocation('')
    setToLocation('')
    setSelectedTransportMode('')
    setPricePerNight(null)
    setShowAIModal(false)
    // Clear cache
    try {
      localStorage.removeItem(cacheKey)
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  const handleCategorySelect = (category: 'travel' | 'activity' | 'stay') => {
    setSelectedCategory(category)
    setCurrentPhase(2)
  }

  const handleEntryMethodSelect = (method: 'manual' | 'ai') => {
    setEntryMethod(method)
    if (method === 'ai') {
      setShowAIModal(true)
    } else {
      setCurrentPhase(3)
    }
  }

  const handleAISelectOption = (option: any) => {
    if (!selectedCategory) return

    // Fill form based on selected option and search terms from modal
    if (selectedCategory === 'travel') {
      // Use search terms from modal if available, otherwise use form state
      const fromValue = option.from || fromLocation || ''
      const toValue = option.to || toLocation || ''
      setFromLocation(fromValue)
      setToLocation(toValue)
      setSelectedTransportMode(option.mode || '')
      setPrice(option.price_numeric?.toString() || '')
      setPlace(`${fromValue} to ${toValue} (${option.mode || ''})`)
    } else if (selectedCategory === 'activity') {
      // Use activity name from API response, or search term as fallback
      const placeValue = option.activity_name || option.place || ''
      setPlace(placeValue)
      setPrice(option.price_numeric?.toString() || '')
    } else if (selectedCategory === 'stay') {
      // Use search terms from modal if available
      const locationValue = option.location || option.hotel_name || ''
      setPlace(locationValue)
      const pricePerNight = option.price_numeric
      setPricePerNight(pricePerNight)
      
      // Calculate total price based on date range
      let totalPrice = pricePerNight
      if (isDateRange && startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        if (nights > 0) {
          totalPrice = pricePerNight * nights
        }
      }
      setPrice(totalPrice.toFixed(2))
    }

    setShowAIModal(false)
    setCurrentPhase(3)
  }

  return (
    <>
      <Card className="shadow-lg relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">Section {sectionNumber}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              clearFormState()
              onClose()
            }}
            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
          {/* Phase 1: Category Selection */}
          {currentPhase === 1 && (
            <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Category</h3>
                <p className="text-gray-600">Choose the type of section you want to add</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id as 'travel' | 'activity' | 'stay')}
                    className="p-8 rounded-xl border-2 border-gray-200 hover:border-green-800 transition-all text-center hover:shadow-lg group"
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{category.icon}</div>
                    <div className="text-base font-semibold text-gray-900">
                      {category.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phase 2: Manual or AI Choice */}
          {currentPhase === 2 && selectedCategory && (
            <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">
                  {categories.find(c => c.id === selectedCategory)?.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  How would you like to add {categories.find(c => c.id === selectedCategory)?.name}?
                </h3>
                <p className="text-gray-600">Choose your preferred method</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <button
                  onClick={() => handleEntryMethodSelect('manual')}
                  className="p-8 rounded-xl border-2 border-gray-200 hover:border-green-800 transition-all text-center hover:shadow-lg group"
                >
                  <div className="text-3xl mb-3">✏️</div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">Enter Details Manually</div>
                  <div className="text-sm text-gray-600">Fill in the form yourself</div>
                </button>
                <button
                  onClick={() => handleEntryMethodSelect('ai')}
                  className="p-8 rounded-xl border-2 border-green-800 bg-green-50 hover:bg-green-100 transition-all text-center hover:shadow-lg group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative text-3xl mb-3">✨</div>
                  <div className="relative text-lg font-semibold text-green-900 mb-2">Search with AI</div>
                  <div className="relative text-sm text-green-700">Let AI find the best options</div>
                </button>
              </div>
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    clearFormState()
                  }}
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Phase 3: Form Fields */}
          {currentPhase === 3 && selectedCategory && (
            <div className="w-full max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {categories.find(c => c.id === selectedCategory)?.name} Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {entryMethod === 'ai' ? 'AI-selected option (you can edit)' : 'Enter the details manually'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPhase(2)
                    setEntryMethod(null)
                    // Clear form fields when going back to entry method selection
                    setPlace('')
                    setPrice('')
                    setDateRange('')
                    setIsDateRange(false)
                    setStartDate('')
                    setEndDate('')
                    setFromLocation('')
                    setToLocation('')
                    setSelectedTransportMode('')
                    setPricePerNight(null)
                  }}
                >
                  Back
                </Button>
              </div>

              <div className="space-y-4">
          {/* Travel-specific fields */}
          {selectedCategory === 'travel' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>
                  <input
                    type="text"
                    placeholder="Enter origin location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <input
                    type="text"
                    placeholder="Enter destination location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transportation Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['flight', 'train', 'bus', 'car'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedTransportMode(mode)}
                      className={`px-4 py-2 rounded-md border-2 transition-all capitalize ${selectedTransportMode === mode
                        ? 'border-green-800 bg-green-50 dark:bg-blue-900/20 text-green-900 dark:text-blue-300'
                        : 'border-gray-300 hover:border-green-300 dark:hover:border-green-800'
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Activity-specific field */}
          {selectedCategory === 'activity' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Name
              </label>
              <input
                type="text"
                placeholder="Enter activity name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </div>
          )}

          {/* Stay category - show Place */}
          {selectedCategory === 'stay' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Place
              </label>
              <input
                type="text"
                placeholder="Enter place name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <input
              type="number"
              placeholder="Enter price"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value)
                // For Stay category in single date mode, store as price per night
                if (selectedCategory === 'stay' && !isDateRange) {
                  const priceNum = parseFloat(e.target.value)
                  if (!isNaN(priceNum)) {
                    setPricePerNight(priceNum)
                  }
                }
              }}
              min="0"
              step="0.01"
            />
          </div>

          {/* Date fields - different for Activity vs others */}
          {selectedCategory === 'activity' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                placeholder="Select date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date / Date Range
              </label>
              <div className="mb-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={isDateRange}
                    onChange={(e) => {
                      const newIsDateRange = e.target.checked
                      setIsDateRange(newIsDateRange)

                      // For Stay category: handle price conversion when switching date range mode
                      if (selectedCategory === 'stay' && price) {
                        const priceNum = parseFloat(price)
                        if (!isNaN(priceNum)) {
                          if (newIsDateRange && !isDateRange) {
                            // Switching from single date to date range
                            // Store current price as price per night
                            setPricePerNight(priceNum)
                            if (startDate && endDate) {
                              const start = new Date(startDate)
                              const end = new Date(endDate)
                              const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                              if (nights > 0) {
                                setPrice((priceNum * nights).toFixed(2))
                              }
                            }
                          } else if (!newIsDateRange && isDateRange) {
                            // Switching from date range to single date
                            // Use stored price per night or calculate from current price
                            if (pricePerNight) {
                              setPrice(pricePerNight.toFixed(2))
                            } else if (startDate && endDate) {
                              const start = new Date(startDate)
                              const end = new Date(endDate)
                              const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                              if (nights > 0) {
                                setPrice((priceNum / nights).toFixed(2))
                                setPricePerNight(priceNum / nights)
                              }
                            }
                          }
                        }
                      }
                    }}
                    className="rounded"
                  />
                  Use date range
                </label>
              </div>
              {isDateRange ? (
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    placeholder="Start Date"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      // Recalculate price for Stay when dates change in date range mode
                      if (selectedCategory === 'stay' && isDateRange && e.target.value && endDate) {
                        const nights = calculateNights(e.target.value, endDate)
                        if (nights > 0) {
                          const perNight = pricePerNight || (price ? parseFloat(price) / (calculateNights(startDate, endDate) || 1) : 0)
                          if (perNight > 0) {
                            setPricePerNight(perNight)
                            setPrice((perNight * nights).toFixed(2))
                          }
                        }
                      }
                    }}
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      // Recalculate price for Stay when dates change in date range mode
                      if (selectedCategory === 'stay' && isDateRange && startDate && e.target.value) {
                        const nights = calculateNights(startDate, e.target.value)
                        if (nights > 0) {
                          const perNight = pricePerNight || (price ? parseFloat(price) / (calculateNights(startDate, endDate) || 1) : 0)
                          if (perNight > 0) {
                            setPricePerNight(perNight)
                            setPrice((perNight * nights).toFixed(2))
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <input
                  type="date"
                  placeholder="Select date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                />
              )}
            </div>
          )}
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    clearFormState()
                    onClose()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Search Modal */}
      {selectedCategory && (
        <AISearchModal
          isOpen={showAIModal}
          onClose={() => {
            setShowAIModal(false)
            if (currentPhase === 2) {
              setEntryMethod(null)
            }
          }}
          category={selectedCategory as 'travel' | 'activity' | 'stay'}
          tripId={tripId}
          onSelectOption={handleAISelectOption}
          initialData={{
            place,
            price,
            dateRange: isDateRange ? `${startDate}|${endDate}` : dateRange,
            from: fromLocation,
            to: toLocation,
            transportMode: selectedTransportMode,
          }}
        />
      )}
    </>
  )
}

function StopBuilder({ stop, tripId, onDelete }: any) {
  const [days, setDays] = useState<any[]>([])
  const [showActivitySearch, setShowActivitySearch] = useState(false)
  const [selectedDay, setSelectedDay] = useState<any>(null)

  useEffect(() => {
    fetchDays()
  }, [stop.stop_id])

  const fetchDays = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`)
      const data = await res.json()
      const stopData = data.itinerary?.find((s: any) => s.stop_id === stop.stop_id)
      setDays(stopData?.itinerary_days || [])
    } catch (error) {
      console.error('Error fetching days:', error)
    }
  }

  const handleAddDay = async () => {
    const dayNumber = days.length + 1
    const dayDate = new Date(stop.arrival_date)
    dayDate.setDate(dayDate.getDate() + days.length)

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stop_id: stop.stop_id,
          day_date: dayDate.toISOString().split('T')[0],
          day_number: dayNumber,
        }),
      })

      if (res.ok) {
        fetchDays()
      }
    } catch (error) {
      console.error('Error adding day:', error)
    }
  }

  const handleAddActivity = async (activityId: number | null, customName: string | null) => {
    if (!selectedDay) return

    const activityOrder = (selectedDay.itinerary_activities?.length || 0) + 1

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_id: selectedDay.day_id,
          activity_id: activityId,
          activity_order: activityOrder,
          custom_activity_name: customName,
        }),
      })

      if (res.ok) {
        fetchDays()
        setShowActivitySearch(false)
        setSelectedDay(null)
      }
    } catch (error) {
      console.error('Error adding activity:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {stop.cities?.city_name}, {stop.cities?.country}
        </h2>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-red-600 hover:text-red-700"
        >
          Delete
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={handleAddDay}
          className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 text-sm"
        >
          + Add Day
        </button>
      </div>

      <div className="space-y-4">
        {days.map((day: any) => (
          <div key={day.day_id} className="border-l-2 border-green-800 pl-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900">
                Day {day.day_number} - {formatDateDDMMYYYY(day.day_date)}
              </h3>
              <button
                onClick={() => {
                  setSelectedDay(day)
                  setShowActivitySearch(true)
                }}
                className="px-3 py-1 bg-green-800 text-white rounded-md hover:bg-green-900 text-sm"
              >
                + Add Activity
              </button>
            </div>
            {day.itinerary_activities && day.itinerary_activities.length > 0 && (
              <div className="space-y-1">
                {day.itinerary_activities.map((activity: any) => (
                  <div key={activity.itinerary_activity_id} className="text-sm text-gray-600">
                    {activity.activities?.activity_name || activity.custom_activity_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showActivitySearch && (
        <ActivitySearchModal
          cityId={stop.city_id}
          onSelectActivity={(activityId: number | null, customName: string | null) => handleAddActivity(activityId, customName)}
          onClose={() => {
            setShowActivitySearch(false)
            setSelectedDay(null)
          }}
        />
      )}
    </div>
  )
}

function ActivitySearchModal({ cityId, onSelectActivity, onClose }: any) {
  const [activities, setActivities] = useState<any[]>([])
  const [customName, setCustomName] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<any>(null)

  useEffect(() => {
    fetchActivities()
  }, [cityId])

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/activities?city_id=${cityId}`)
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const handleSelect = () => {
    if (selectedActivity) {
      onSelectActivity(selectedActivity.activity_id, null)
    } else if (customName) {
      onSelectActivity(null, customName)
    }
  }

  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold mb-2">Add Activity</h3>
      <input
        type="text"
        placeholder="Or enter custom activity name"
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
        value={customName}
        onChange={(e) => {
          setCustomName(e.target.value)
          setSelectedActivity(null)
        }}
      />
      <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
        {activities.map((activity) => (
          <div
            key={activity.activity_id}
            onClick={() => {
              setSelectedActivity(activity)
              setCustomName('')
            }}
            className={`p-2 border rounded cursor-pointer text-sm ${selectedActivity?.activity_id === activity.activity_id
              ? 'border-green-800 bg-green-50 dark:bg-blue-900/20'
              : 'border-gray-300'
              }`}
          >
            <div className="font-medium">{activity.activity_name}</div>
            {activity.estimated_cost && (
              <div className="text-xs text-gray-600">
                ${activity.estimated_cost}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSelect}
          disabled={!selectedActivity && !customName}
          className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 disabled:opacity-50 text-sm"
        >
          Add
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

