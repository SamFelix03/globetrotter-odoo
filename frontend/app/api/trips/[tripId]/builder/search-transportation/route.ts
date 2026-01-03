import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const body = await request.json()
    const { from, to } = body

    if (!from || !to) {
      return NextResponse.json(
        { error: 'From and To locations are required' },
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
    const userQuery = `Search for transportation options from "${from}" to "${to}". 

You MUST return ONLY valid JSON in this exact format (no additional text, no markdown, just pure JSON):

{
  "from": "${from}",
  "to": "${to}",
  "transportation_options": [
    {
      "mode": "flight",
      "price": "$XXX",
      "price_numeric": XXX,
      "currency": "USD",
      "source_url": "https://example.com",
      "duration": "X hours",
      "provider": "Airline Name"
    },
    {
      "mode": "train",
      "price": "$XXX",
      "price_numeric": XXX,
      "currency": "USD",
      "source_url": "https://example.com",
      "duration": "X hours",
      "provider": "Train Company"
    }
  ]
}

Include all available modes: flight, train, bus, car rental, etc. For each option, provide:
- mode: the transportation type
- price: formatted price string
- price_numeric: numeric price value
- currency: currency code
- source_url: the exact URL where you found this price
- duration: estimated travel time
- provider: company/service name

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

      // Try to match sources to transportation options
      if (jsonResult.transportation_options) {
        jsonResult.transportation_options.forEach((option: any, index: number) => {
          // If source_url is not set or is a placeholder, try to assign from response sources
          if (!option.source_url || option.source_url.includes('example.com')) {
            if (response.sources[index]) {
              option.source_url = response.sources[index].url
            }
          }
        })
      }
    }

    return NextResponse.json(jsonResult, { status: 200 })
  } catch (error: any) {
    console.error('Error during transportation search:', error)
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
      if (parsed.transportation_options && Array.isArray(parsed.transportation_options)) {
        return parsed
      }
    } catch (e) {
      console.warn('JSON parsing error:', e)
    }
  }

  return null
}

