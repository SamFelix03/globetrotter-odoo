import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { destination, budget, startDate, endDate, originState } = body;

    if (!destination || !budget || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Destination, budget, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Use originState if provided, otherwise default to a generic location
    const fromLocation = originState || "Your Current Location";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", authUser.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Call OpenAI to generate trip plan
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const userQuery = `Create a comprehensive ${days}-day trip itinerary from "${fromLocation}" to "${destination}" with a total budget of ₹${budget} INR.

IMPORTANT REQUIREMENTS:
- All prices MUST be in Indian Rupees (INR). Use ₹ symbol.
- Convert any USD prices to INR (approximate conversion: 1 USD ≈ 83 INR).
- Dates: ${startDate} to ${endDate} (${days} days)
- Budget per day: approximately ₹${Math.round(budget / days)} INR
- Create a realistic itinerary with popular attractions, good restaurants, and comfortable accommodations
- CRITICAL: EVERY activity section MUST have a price. No activity can be listed without a price. If an activity is free, set price to 0. If price is unknown, estimate a reasonable price based on similar activities in the area.

You MUST return ONLY valid JSON in this exact format (no additional text, no markdown, just pure JSON):

{
  "trip_name": "Trip Name",
  "trip_description": "Brief description of the trip",
  "sections": [
    {
      "category": "travel",
      "from_location": "${fromLocation}",
      "to_location": "${destination}",
      "transport_mode": "flight",
      "price": 5000,
      "currency": "INR",
      "date_single": "${startDate}",
      "is_date_range": false
    },
    {
      "category": "stay",
      "place": "Hotel Name",
      "price_per_night": 2000,
      "price": 14000,
      "currency": "INR",
      "date_start": "${startDate}",
      "date_end": "${endDate}",
      "is_date_range": true
    },
    {
      "category": "activity",
      "place": "Activity Name",
      "price": 500,
      "currency": "INR",
      "date_single": "${startDate}",
      "is_date_range": false
    }
  ]
}

Include:
1. One travel section for getting to the destination (on start date)
2. One stay section for accommodation (date range from start to end)
3. Multiple activity sections (2-4 per day) for:
   - Popular tourist attractions
   - Restaurants/cafes for meals
   - Cultural experiences
   - Shopping areas
   - Nightlife (if applicable)

For each section:
- category: "travel", "stay", or "activity"
- place: name of the place/activity
- price: price in INR (MANDATORY for ALL sections - travel, stay, and activity. For stay, this is total price, also include price_per_night)
- currency: "INR"
- dates: use date_single for single day activities, date_start and date_end with is_date_range=true for stays
- For travel: include from_location (must be "${fromLocation}"), to_location, transport_mode
- For stay: include price_per_night
- MANDATORY: Every activity section MUST have a price field. If an activity is free, use price: 0. Never omit the price field for any activity.

Distribute the budget realistically:
- Transportation: 15-25% of budget
- Accommodation: 40-50% of budget
- Activities/Food: 30-40% of budget

Return ONLY the JSON object, nothing else.`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      tools: [{ type: "web_search_preview" }],
      input: userQuery,
    });

    // Extract the output text
    const aiOutput = response.output_text.trim();

    // Try to extract JSON from the response
    let jsonResult = extractJSON(aiOutput);

    if (!jsonResult) {
      return NextResponse.json(
        {
          error: "Could not parse AI response",
          raw_output: aiOutput.substring(0, 500),
        },
        { status: 500 }
      );
    }

    // Create trip in database
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        user_id: userData.user_id,
        trip_name: jsonResult.trip_name || `Trip to ${destination}`,
        trip_description:
          jsonResult.trip_description ||
          `AI-generated trip plan for ${destination}`,
        start_date: startDate,
        end_date: endDate,
        total_budget: budget,
        estimated_cost:
          jsonResult.sections?.reduce(
            (sum: number, section: any) => sum + (section.price || 0),
            0
          ) || 0,
      })
      .select()
      .single();

    if (tripError || !trip) {
      console.error("Error creating trip:", tripError);
      return NextResponse.json(
        { error: "Failed to create trip" },
        { status: 500 }
      );
    }

    // Create trip sections
    if (
      jsonResult.sections &&
      Array.isArray(jsonResult.sections) &&
      jsonResult.sections.length > 0
    ) {
      // Validate that all activities have prices
      const activitiesWithoutPrice = jsonResult.sections.filter(
        (section: any) =>
          section.category === "activity" &&
          (section.price === undefined || section.price === null)
      );

      if (activitiesWithoutPrice.length > 0) {
        console.warn(
          `Found ${activitiesWithoutPrice.length} activities without prices. Adding default prices.`
        );
        // Add default prices for activities missing prices
        activitiesWithoutPrice.forEach((section: any) => {
          section.price = 0; // Default to free if not specified
        });
      }

      const sectionsToInsert = jsonResult.sections.map(
        (section: any, index: number) => {
          // Ensure activity sections always have a price
          let price = section.price;
          if (section.category === "activity") {
            price =
              section.price !== undefined && section.price !== null
                ? parseFloat(section.price)
                : 0; // Default to 0 if missing
          } else {
            price = section.price ? parseFloat(section.price) : null;
          }

          return {
            trip_id: trip.trip_id,
            section_order: index + 1,
            category: section.category,
            place: section.place || null,
            price: price,
            currency_code: section.currency || "INR",
            date_single: section.date_single
              ? new Date(section.date_single).toISOString().split("T")[0]
              : null,
            date_start: section.date_start
              ? new Date(section.date_start).toISOString().split("T")[0]
              : null,
            date_end: section.date_end
              ? new Date(section.date_end).toISOString().split("T")[0]
              : null,
            is_date_range: section.is_date_range || false,
            from_location: section.from_location || null,
            to_location: section.to_location || null,
            transport_mode: section.transport_mode || null,
            price_per_night: section.price_per_night
              ? parseFloat(section.price_per_night)
              : null,
            activity_theme: section.activity_theme || null,
          };
        }
      );

      const { error: sectionsError } = await supabase
        .from("trip_sections")
        .insert(sectionsToInsert);

      if (sectionsError) {
        console.error("Error creating sections:", sectionsError);
        // Don't fail the request, trip is already created
      }
    }

    return NextResponse.json(
      {
        tripId: trip.trip_id,
        message: "Trip plan generated successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error during AI trip planning:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function extractJSON(text: string) {
  // Remove markdown code blocks if present
  let cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Try to find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate structure
      if (parsed.sections && Array.isArray(parsed.sections)) {
        return parsed;
      }
    } catch (e) {
      console.warn("JSON parsing error:", e);
    }
  }

  return null;
}
