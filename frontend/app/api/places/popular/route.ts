import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const country = searchParams.get('country')

    if (!country) {
      return NextResponse.json(
        { error: 'Country parameter is required' },
        { status: 400 }
      )
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      )
    }

    // Build Google Place Photo URL
    function getPhotoUrl(photoReference: string, maxWidth = 800) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`
    }

    // Fetch popular places for the country
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    url.searchParams.set('query', `top tourist places in ${country}`)
    url.searchParams.set('key', GOOGLE_API_KEY)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Google API error: ${data.status}` },
        { status: 500 }
      )
    }

    const places = data.results.map((place: any) => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating ?? null,
      types: place.types,
      imageUrl: place.photos?.length
        ? getPhotoUrl(place.photos[0].photo_reference)
        : null,
      placeId: place.place_id,
    }))

    return NextResponse.json({ places }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

