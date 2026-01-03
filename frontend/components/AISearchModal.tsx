'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface AISearchModalProps {
  isOpen: boolean
  onClose: () => void
  category: 'travel' | 'activity' | 'stay'
  tripId: string
  onSelectOption: (option: any) => void
  initialData?: {
    place?: string
    price?: string
    dateRange?: string
    from?: string
    to?: string
    transportMode?: string
  }
}

export default function AISearchModal({
  isOpen,
  onClose,
  category,
  tripId,
  onSelectOption,
  initialData = {},
}: AISearchModalProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [error, setError] = useState('')

  // Travel-specific state
  const [from, setFrom] = useState(initialData.from || '')
  const [to, setTo] = useState(initialData.to || '')
  const [isDateRange, setIsDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [singleDate, setSingleDate] = useState('')

  // Activity-specific state
  const [activityPlace, setActivityPlace] = useState(initialData.place || '')
  const [activityTheme, setActivityTheme] = useState('')
  const [activityMinPrice, setActivityMinPrice] = useState('')
  const [activityMaxPrice, setActivityMaxPrice] = useState('')

  // Stay-specific state
  const [stayLocation, setStayLocation] = useState(initialData.place || '')
  const [stayMinPrice, setStayMinPrice] = useState('')
  const [stayMaxPrice, setStayMaxPrice] = useState('')

  const categories = {
    travel: { name: 'Travel', icon: '✈️' },
    activity: { name: 'Activity', icon: '🎯' },
    stay: { name: 'Stay', icon: '🏨' },
  }

  const selectedCategory = categories[category]

  const handleSearch = async () => {
    setIsSearching(true)
    setError('')

    try {
      let res

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

  const handleSelect = (option: any) => {
    onSelectOption(option)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Search {selectedCategory.name} with AI
            </CardTitle>
            <CardDescription>
              Let AI help you find the best options
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {!searchResults && (
            <>
              {category === 'travel' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From *
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter origin location"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        To *
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter destination location"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {category === 'activity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Place *
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter location/place name"
                        value={activityPlace}
                        onChange={(e) => setActivityPlace(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme *
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., lunch, adventure, culture"
                        value={activityTheme}
                        onChange={(e) => setActivityTheme(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Min price"
                        value={activityMinPrice}
                        onChange={(e) => setActivityMinPrice(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <Input
                        type="number"
                        placeholder="Max price"
                        value={activityMaxPrice}
                        onChange={(e) => setActivityMaxPrice(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              )}

              {category === 'stay' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter city or location name"
                      value={stayLocation}
                      onChange={(e) => setStayLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range per Night (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Min price per night"
                        value={stayMinPrice}
                        onChange={(e) => setStayMinPrice(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <Input
                        type="number"
                        placeholder="Max price per night"
                        value={stayMaxPrice}
                        onChange={(e) => setStayMaxPrice(e.target.value)}
                        min="0"
                        step="0.01"
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
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <Input
                        type="date"
                        value={singleDate}
                        onChange={(e) => setSingleDate(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="flex-1 bg-green-800 hover:bg-green-900"
                >
                  {isSearching ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Searching...
                    </>
                  ) : (
                    `Search ${selectedCategory.name}`
                  )}
                </Button>
              </div>
            </>
          )}

          {isSearching && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mb-4"></div>
              <p className="text-lg text-gray-600">Searching with AI...</p>
            </div>
          )}

          {searchResults && !isSearching && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Available Options
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {category === 'travel' && searchResults.transportation_options?.map((option: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-300 rounded-lg hover:border-green-800 transition-all cursor-pointer"
                    onClick={() => handleSelect(option)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {option.mode}
                        </h4>
                        {option.provider && (
                          <p className="text-sm text-gray-600">{option.provider}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{option.price}</p>
                        {option.duration && (
                          <p className="text-xs text-gray-500">{option.duration}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {category === 'activity' && searchResults.activities?.map((activity: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-300 rounded-lg hover:border-green-800 transition-all cursor-pointer"
                    onClick={() => handleSelect(activity)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{activity.activity_name}</h4>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900">{activity.price}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {category === 'stay' && searchResults.hotels?.map((hotel: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-300 rounded-lg hover:border-green-800 transition-all cursor-pointer"
                    onClick={() => handleSelect(hotel)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{hotel.hotel_name}</h4>
                        {hotel.description && (
                          <p className="text-sm text-gray-600 mt-1">{hotel.description}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900">{hotel.price_per_night}</p>
                        <p className="text-xs text-gray-500">per night</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchResults(null)
                  setError('')
                }}
                className="w-full mt-4"
              >
                New Search
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

