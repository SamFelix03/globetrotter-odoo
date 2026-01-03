import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local first, then .env as fallback
dotenv.config({ path: join(__dirname, ".env.local") });
dotenv.config({ path: join(__dirname, ".env") });

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * Build Google Place Photo URL
 */
function getPhotoUrl(photoReference, maxWidth = 800) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

/**
 * Fetch popular places for a country
 */
async function getPopularPlaces(country) {
  if (!GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY in .env.local");
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  url.searchParams.set("query", `top tourist places in ${country}`);
  url.searchParams.set("key", GOOGLE_API_KEY);

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(`Google API error: ${data.status}`);
  }

  return data.results.map((place) => ({
    name: place.name,
    address: place.formatted_address,
    rating: place.rating ?? null,
    types: place.types,
    imageUrl: place.photos?.length
      ? getPhotoUrl(place.photos[0].photo_reference)
      : null,
  }));
}

/**
 * Run
 */
(async () => {
  try {
    if (!GOOGLE_API_KEY) {
      console.error("❌ Error: Missing GOOGLE_API_KEY in .env.local");
      console.log("\n💡 To fix this:");
      console.log("1. Create or edit .env.local in the frontend directory");
      console.log("2. Add: GOOGLE_API_KEY=your_api_key_here");
      process.exit(1);
    }

    const places = await getPopularPlaces("Italy");
    console.log(JSON.stringify(places, null, 2));
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
