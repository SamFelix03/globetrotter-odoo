'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function BuilderSearchPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = params.tripId as string
  const formId = searchParams.get('formId') || ''
  
  const category = searchParams.get('category') as 'travel' | 'activity' | 'stay' | null
  const place = searchParams.get('place') || ''
  const price = searchParams.get('price') || ''
  const dateRange = searchParams.get('dateRange') || ''
  const fromParam = searchParams.get('from') || ''
  const toParam = searchParams.get('to') || ''
  const transportMode = searchParams.get('transportMode') || ''

  const [from, setFrom] = useState(fromParam)
  const [to, setTo] = useState(toParam)
  const [isDateRange, setIsDateRange] = useState(dateRange.includes('|'))
  const [startDate, setStartDate] = useState(dateRange.includes('|') ? dateRange.split('|')[0] : '')
  const [endDate, setEndDate] = useState(dateRange.includes('|') ? dateRange.split('|')[1] : '')
  const [singleDate, setSingleDate] = useState(dateRange.includes('|') ? '' : dateRange)
  // Activity-specific fields
  const [activityPlace, setActivityPlace] = useState('')
  const [activityTheme, setActivityTheme] = useState('')
  const [activityMinPrice, setActivityMinPrice] = useState('')
  const [activityMaxPrice, setActivityMaxPrice] = useState('')
  // Stay-specific fields
  const [stayLocation, setStayLocation] = useState('')
  const [stayMinPrice, setStayMinPrice] = useState('')
  const [stayMaxPrice, setStayMaxPrice] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [error, setError] = useState('')

  const categories = [
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'activity', name: 'Activity', icon: '🎯' },
    { id: 'stay', name: 'Stay', icon: '🏨' },
  ]

  const selectedCategory = categories.find(c => c.id === category)

  const handleSearch = async () => {
    setIsSearching(true)
    setError('')

    try {
      let res
      let requestBody

      if (category === 'travel') {
        if (!from || !to) {
          setError('Please enter both From and To locations to search')
          setIsSearching(false)
          return
        }
        res = await fetch(`/api/trips/${tripId}/builder/search-transportation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to }),
        })
      } else if (category === 'activity') {
        if (!activityPlace || !activityTheme) {
          setError('Please enter both Place and Theme to search')
          setIsSearching(false)
          return
        }
        res = await fetch(`/api/trips/${tripId}/builder/search-activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            place: activityPlace, 
            theme: activityTheme,
            minPrice: activityMinPrice ? parseFloat(activityMinPrice) : null,
            maxPrice: activityMaxPrice ? parseFloat(activityMaxPrice) : null,
          }),
        })
      } else if (category === 'stay') {
        if (!stayLocation) {
          setError('Please enter Location to search')
          setIsSearching(false)
          return
        }
        const dateRangeValue = isDateRange 
          ? `${startDate}|${endDate}` 
          : singleDate || ''
        res = await fetch(`/api/trips/${tripId}/builder/search-stay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            location: stayLocation,
            minPrice: stayMinPrice ? parseFloat(stayMinPrice) : null,
            maxPrice: stayMaxPrice ? parseFloat(stayMaxPrice) : null,
            dateRange: dateRangeValue,
          }),
        })
      } else {
        setIsSearching(false)
        return
      }

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Search failed')
        setIsSearching(false)
        return
      }

      setSearchResults(data)
      setIsSearching(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred during search')
      setIsSearching(false)
    }
  }

  const handleSelectOption = (option: any) => {
    // Update the form cache with selected option
    if (formId) {
      const cacheKey = `sectionForm_${tripId}_${formId}`
      try {
        const cached = localStorage.getItem(cacheKey)
        const formData = cached ? JSON.parse(cached) : {}
        
        if (category === 'travel') {
          // Update form data with selected transportation option
          formData.fromLocation = from
          formData.toLocation = to
          formData.selectedTransportMode = option.mode
          formData.price = option.price_numeric.toString()
          formData.place = `${from} to ${to} (${option.mode})`
        } else if (category === 'activity') {
          // Update form data with selected activity option
          formData.place = option.activity_name
          formData.price = option.price_numeric.toString()
        } else if (category === 'stay') {
          // Update form data with selected hotel option
          formData.place = option.hotel_name
          
          // Store price per night for recalculation
          const pricePerNight = option.price_numeric
          
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
          formData.price = totalPrice.toFixed(2)
          // Store price per night in a way that can be retrieved (we'll use a separate cache key or store in formData)
          formData.pricePerNight = pricePerNight
        }
        
        // Update date fields
        if (isDateRange) {
          formData.startDate = startDate
          formData.endDate = endDate
          formData.isDateRange = true
          formData.dateRange = ''
        } else if (singleDate) {
          formData.dateRange = singleDate
          formData.isDateRange = false
          formData.startDate = ''
          formData.endDate = ''
        }
        
        localStorage.setItem(cacheKey, JSON.stringify(formData))
      } catch (error) {
        console.error('Error updating form cache:', error)
      }
    }

    // Navigate back to builder
    router.push(`/trips/${tripId}/builder`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href={`/trips/${tripId}/builder`} 
            className="text-green-800 hover:text-green-900"
          >
            ← Back to Builder
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Search {selectedCategory?.name || 'Options'}
          </h1>
          
          {selectedCategory && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">{selectedCategory.icon}</span>
              <span className="text-lg font-semibold text-gray-700">
                {selectedCategory.name}
              </span>
            </div>
          )}
          
          {place && (
            <div className="mb-2 text-sm text-gray-600">
              <span className="font-medium">Place:</span> {place}
            </div>
          )}
          {price && (
            <div className="mb-2 text-sm text-gray-600">
              <span className="font-medium">Price:</span> ${price}
            </div>
          )}
          {dateRange && (
            <div className="mb-4 text-sm text-gray-600">
              <span className="font-medium">Date:</span> {dateRange.includes('|') ? dateRange.split('|').join(' - ') : dateRange}
            </div>
          )}
        </div>

        {selectedCategory && category === 'travel' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Search Transportation Options
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>
                  <input
                    type="text"
                    placeholder="Enter origin location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
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
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date / Date Range
                </label>
                <div className="mb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={isDateRange}
                      onChange={(e) => setIsDateRange(e.target.checked)}
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
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                      type="date"
                      placeholder="End Date"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                ) : (
                  <input
                    type="date"
                    placeholder="Select date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                  />
                )}
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search Transportation Options'}
              </button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {searchResults && searchResults.transportation_options && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Available Options
                </h3>
                <div className="space-y-3">
                  {searchResults.transportation_options.map((option: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-300 rounded-lg hover:border-green-800 dark:hover:border-green-800 transition-all cursor-pointer"
                      onClick={() => handleSelectOption(option)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {option.mode}
                          </h4>
                          {option.provider && (
                            <p className="text-sm text-gray-600">
                              {option.provider}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {option.price}
                          </p>
                          {option.duration && (
                            <p className="text-xs text-gray-500">
                              {option.duration}
                            </p>
                          )}
                        </div>
                      </div>
                      {option.source_url && (
                        <a
                          href={option.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-green-800 hover:underline"
                        >
                          View source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory && category !== 'travel' && category !== 'activity' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Search functionality for {selectedCategory.name.toLowerCase()} will be implemented in the next step.
                </p>
              </div>
            )}
          </div>
        )}

        {selectedCategory && category === 'activity' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Search Activity Options
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Place
                  </label>
                  <input
                    type="text"
                    placeholder="Enter location/place name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={activityPlace}
                    onChange={(e) => setActivityPlace(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., lunch, adventure, culture"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={activityTheme}
                    onChange={(e) => setActivityTheme(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Min price"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    value={activityMinPrice}
                    onChange={(e) => setActivityMinPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="number"
                    placeholder="Max price"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    value={activityMaxPrice}
                    onChange={(e) => setActivityMaxPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search Activities'}
              </button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {searchResults && searchResults.activities && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Available Activities
                </h3>
                <div className="space-y-3">
                  {searchResults.activities.map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-300 rounded-lg hover:border-green-800 dark:hover:border-green-800 transition-all cursor-pointer"
                      onClick={() => handleSelectOption(activity)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {activity.activity_name}
                          </h4>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.description}
                            </p>
                          )}
                          {activity.category && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {activity.category}
                            </span>
                          )}
                          {activity.rating && (
                            <p className="text-xs text-gray-500 mt-1">
                              ⭐ {activity.rating}/5
                            </p>
                          )}
                          {activity.address && (
                            <p className="text-xs text-gray-500 mt-1">
                              📍 {activity.address}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900">
                            {activity.price}
                          </p>
                        </div>
                      </div>
                      {activity.source_url && (
                        <a
                          href={activity.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-green-800 hover:underline"
                        >
                          View source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedCategory && category === 'stay' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Search Hotel Options
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter city or location name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                  value={stayLocation}
                  onChange={(e) => setStayLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Range per Night (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Min price per night"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    value={stayMinPrice}
                    onChange={(e) => setStayMinPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="number"
                    placeholder="Max price per night"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    value={stayMaxPrice}
                    onChange={(e) => setStayMaxPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date / Date Range
                </label>
                <div className="mb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={isDateRange}
                      onChange={(e) => setIsDateRange(e.target.checked)}
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
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                      type="date"
                      placeholder="End Date"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                ) : (
                  <input
                    type="date"
                    placeholder="Select date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                  />
                )}
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search Hotels'}
              </button>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            {searchResults && searchResults.hotels && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Available Hotels
                </h3>
                <div className="space-y-3">
                  {searchResults.hotels.map((hotel: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-600 transition-all cursor-pointer"
                      onClick={() => handleSelectOption(hotel)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {hotel.hotel_name}
                          </h4>
                          {hotel.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {hotel.description}
                            </p>
                          )}
                          {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {hotel.amenities.map((amenity: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}
                          {hotel.rating && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ⭐ {hotel.rating}/5
                            </p>
                          )}
                          {hotel.address && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              📍 {hotel.address}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {hotel.price_per_night}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            per night
                          </p>
                        </div>
                      </div>
                      {hotel.source_url && (
                        <a
                          href={hotel.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

