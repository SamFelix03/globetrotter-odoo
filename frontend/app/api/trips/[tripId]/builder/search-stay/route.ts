import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const body = await request.json()
    const { location, minPrice, maxPrice, dateRange } = body

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Build price range filter text
    let priceFilterText = ''
    if (minPrice && maxPrice) {
      priceFilterText = ` within the price range of $${minPrice} to $${maxPrice} per night`
    } else if (minPrice) {
      priceFilterText = ` with a minimum price of $${minPrice} per night`
    } else if (maxPrice) {
      priceFilterText = ` with a maximum price of $${maxPrice} per night`
    }

    // Build date context
    let dateContext = ''
    if (dateRange) {
      if (dateRange.includes('|')) {
        const [start, end] = dateRange.split('|')
        dateContext = ` for dates from ${start} to ${end}`
      } else {
        dateContext = ` for date ${dateRange}`
      }
    }

    // Create a very specific prompt that requires strict JSON output
    const userQuery = `Search for hotels and accommodations in "${location}"${priceFilterText}${dateContext}. 

You MUST return ONLY valid JSON in this exact format (no additional text, no markdown, just pure JSON):

{
  "location": "${location}",
  "price_range": {
    "min": ${minPrice || 'null'},
    "max": ${maxPrice || 'null'}
  },
  "hotels": [
    {
      "hotel_name": "Hotel Name",
      "price_per_night": "$XXX",
      "price_numeric": XXX,
      "currency": "USD",
      "source_url": "https://example.com",
      "description": "Brief description of the hotel",
      "rating": 4.5,
      "address": "Street address",
      "amenities": ["wifi", "pool", "parking"]
    }
  ]
}

For each hotel, provide:
- hotel_name: the name of the hotel/accommodation
- price_per_night: formatted price string per night (e.g., "$150", "$200-300")
- price_numeric: numeric price value per night (use average for ranges)
- currency: currency code
- source_url: the exact URL where you found this price
- description: brief description of the hotel
- rating: rating if available (0-5 scale)
- address: physical address if available
- amenities: array of key amenities (wifi, pool, parking, breakfast, etc.)

${priceFilterText ? `IMPORTANT: Only include hotels that fall within the specified price range per night.` : ''}

Return ONLY the JSON object, nothing else.`

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      tools: [{ type: 'web_search' }],
      input: userQuery,
    })

    // Extract the output text
    const aiOutput = response.output_text.trim()

    // Try to extract JSON from the response
    let jsonResult = extractJSON(aiOutput)

    // If no JSON found, return error
    if (!jsonResult) {
      return NextResponse.json(
        {
          error: 'Could not parse AI response',
          raw_output: aiOutput.substring(0, 500),
        },
        { status: 500 }
      )
    }

    // Add sources if available
    if (response.sources && response.sources.length > 0) {
      jsonResult.all_sources = response.sources.map((src: any) => src.url)

      // Try to match sources to hotels
      if (jsonResult.hotels) {
        jsonResult.hotels.forEach((hotel: any, index: number) => {
          // If source_url is not set or is a placeholder, try to assign from response sources
          if (!hotel.source_url || hotel.source_url.includes('example.com')) {
            if (response.sources[index]) {
              hotel.source_url = response.sources[index].url
            }
          }
        })
      }
    }

    return NextResponse.json(jsonResult, { status: 200 })
  } catch (error: any) {
    console.error('Error during stay search:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function extractJSON(text: string) {
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  // Try to find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      // Validate structure
      if (parsed.hotels && Array.isArray(parsed.hotels)) {
        return parsed
      }
    } catch (e) {
      console.warn('JSON parsing error:', e)
    }
  }

  return null
}

