import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const body = await request.json()
    const { place, theme } = body

    if (!place || !theme) {
      return NextResponse.json(
        { error: 'Place and Theme are required' },
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

    // Create a very specific prompt that requires strict JSON output
    const userQuery = `Search for activities in "${place}" related to the theme "${theme}". 

Examples:
- If theme is "lunch", find restaurants, cafes, or dining places
- If theme is "adventure", find adventure activities, tours, or experiences
- If theme is "culture", find museums, galleries, cultural sites
- If theme is "nightlife", find bars, clubs, entertainment venues
- If theme is "shopping", find shopping areas, markets, stores

You MUST return ONLY valid JSON in this exact format (no additional text, no markdown, just pure JSON):

{
  "place": "${place}",
  "theme": "${theme}",
  "activities": [
    {
      "activity_name": "Restaurant Name",
      "price": "$XXX",
      "price_numeric": XXX,
      "currency": "USD",
      "source_url": "https://example.com",
      "description": "Brief description of the activity",
      "category": "restaurant",
      "rating": 4.5,
      "address": "Street address if available"
    },
    {
      "activity_name": "Another Activity",
      "price": "$XXX",
      "price_numeric": XXX,
      "currency": "USD",
      "source_url": "https://example.com",
      "description": "Brief description",
      "category": "activity_type",
      "rating": 4.0,
      "address": "Street address if available"
    }
  ]
}

For each activity, provide:
- activity_name: the name of the activity/venue
- price: formatted price string (e.g., "$50", "$20-30", "Free")
- price_numeric: numeric price value (use 0 for free, average for ranges)
- currency: currency code
- source_url: the exact URL where you found this information
- description: brief description of what the activity is
- category: type of activity (restaurant, museum, tour, etc.)
- rating: rating if available (0-5 scale)
- address: physical address if available

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

      // Try to match sources to activities
      if (jsonResult.activities) {
        jsonResult.activities.forEach((activity: any, index: number) => {
          // If source_url is not set or is a placeholder, try to assign from response sources
          if (!activity.source_url || activity.source_url.includes('example.com')) {
            if (response.sources[index]) {
              activity.source_url = response.sources[index].url
            }
          }
        })
      }
    }

    return NextResponse.json(jsonResult, { status: 200 })
  } catch (error: any) {
    console.error('Error during activity search:', error)
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
      if (parsed.activities && Array.isArray(parsed.activities)) {
        return parsed
      }
    } catch (e) {
      console.warn('JSON parsing error:', e)
    }
  }

  return null
}

