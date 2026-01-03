'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function CitySearchPage() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [cities, setCities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const cityId = searchParams.get('city_id')
    if (cityId) {
      fetchCities(`city_id=${cityId}`)
    } else {
      fetchCities()
    }
  }, [searchParams])

  const fetchCities = async (query = '') => {
    setLoading(true)
    try {
      let url = '/api/cities?'
      if (query) {
        url += query
      } else {
        if (search) url += `search=${encodeURIComponent(search)}&`
        if (country) url += `country=${encodeURIComponent(country)}&`
      }
      url += 'limit=50'

      const res = await fetch(url)
      const data = await res.json()
      setCities(data.cities || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching cities:', error)
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCities()
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Cities</h1>

        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by city or country..."
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by country..."
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <div
                key={city.city_id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {city.city_name}
                </h3>
                <p className="text-gray-600 mb-2">{city.country}</p>
                {city.region && (
                  <p className="text-sm text-gray-500 mb-2">{city.region}</p>
                )}
                {city.cost_index && (
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    ${city.cost_index}/day
                  </p>
                )}
                {city.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {city.description}
                  </p>
                )}
                <Link
                  href={`/activities/search?city_id=${city.city_id}`}
                  className="text-green-800 hover:text-green-900 text-sm"
                >
                  View Activities →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

