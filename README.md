# Globetrotter - Multi-City Trip Planner

**Live Demo:** [https://globetrotter-odoo-kappa.vercel.app](https://globetrotter-odoo-kappa.vercel.app)

<img width="2168" height="1349" alt="image" src="https://github.com/user-attachments/assets/f0e1a2b6-524a-479d-85f4-5c1a1bfd8400" />

## Table of Contents

1. [Introduction](#introduction)
2. [Technology Stack](#technology-stack)
3. [Getting Started](#getting-started)
4. [Core Features](#core-features)
5. [AI Functionalities](#ai-functionalities)
6. [Admin Panel](#admin-panel)
7. [API Documentation](#api-documentation)
8. [Development](#development)
9. [Conclusion](#conclusion)

---

## Introduction

GlobeTrotter is a comprehensive travel planning application that enables users to create, manage, and share multi-city travel itineraries. Built with Next.js 16 and React 19, it provides an intuitive platform for planning complex trips with budget tracking, activity scheduling, and AI-powered trip generation.

**Key Features:**
- User authentication and profile management
- Multi-city trip planning with itinerary builder
- Budget tracking and expense management
- AI-powered trip planning and activity search
- Public trip sharing and community features
- Calendar view and visualizations

---

## Technology Stack

**Core:**
- Next.js 16.1.1 (App Router, Server Components, API Routes)
- React 19.2.3
- TypeScript 5

**Backend:**
- Supabase (PostgreSQL, Auth, Storage)

**UI & Styling:**
- Tailwind CSS 4
- Radix UI (component primitives)
- Material-UI 7 (date pickers)
- Recharts (charts)
- Lucide React (icons)

**Utilities:**
- date-fns, dayjs (date handling)
- OpenAI API (AI features)
- @supabase/ssr, @supabase/supabase-js

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account

### Installation

1. **Clone and Install:**
   ```bash
   git clone <repository-url>
   cd globetrotter-odoo/frontend
   npm install
   ```

2. **Set Up Supabase:**
   - Create project at https://supabase.com
   - Run database schema SQL script
   - Get Project URL and anon key from Settings > API

3. **Environment Variables:**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   OPENAI_API_KEY=your_openai_key
   GOOGLE_API_KEY=your_google_places_api_key
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

---

## Core Features

### Authentication

- Email/password authentication via Supabase Auth
- Email verification
- Password reset
- Session management with secure cookies
- Protected routes via middleware

### Trip Management

**Trip Operations:**
- Create trips with name, description, dates, budget
- Upload cover photos
- Set public/private visibility
- Edit and delete trips
- Copy trips from other users
- View trip statistics

**Trip Structure:**
- Multiple city stops with arrival/departure dates
- Accommodation information per stop
- Transportation between stops
- Day-by-day itinerary with activities
- Budget and expense tracking

### Itinerary Builder

The itinerary builder provides an intuitive interface for planning day-by-day activities across multiple cities. Users can organize their trips with detailed scheduling, activity management, and seamless integration with the activity catalog.

**Key Features:**
- Add multiple cities (stops) to trips
- Plan activities for each day
- Search and add activities from catalog
- Create custom activities
- Set activity times and durations
- Add notes and booking references
- AI-powered search for activities, accommodations, and transportation

![Itinerary Builder](https://github.com/user-attachments/assets/c4a80778-b489-4bcc-bb7b-ee90067a10a7)

The builder interface allows users to organize their trip by adding travel sections, accommodation stays, and activities. Each section can be customized with dates, prices, and additional details. The AI search functionality helps users discover the best options for their itinerary.

### Budget Tracking

Comprehensive budget management with real-time calculations and visual analytics. Users can set budgets, track expenses by category, and monitor spending throughout their trip planning process.

**Key Features:**
- Set total trip budget (in INR)
- Automatic cost estimation from activities
- Manual expense entry with categories
- Real-time budget calculations
- Visual charts (pie and bar charts)
- Average cost per day calculation
- Budget breakdown by category

**Budget Distribution:**
- Transportation: 15-25%
- Accommodation: 40-50%
- Activities/Food: 30-40%

![Budget and Cost Breakdown](https://github.com/user-attachments/assets/e4f15829-e093-479f-ba08-f7ba59529758)

The budget page provides a detailed breakdown of all expenses, showing estimated costs, actual expenses, and remaining budget. Visual charts help users understand their spending patterns across different categories, making it easy to stay within budget limits.

### City and Activity Search

- Search cities by name or country
- Filter by region
- Search activities by city and category
- Filter by cost range and duration
- View activity details, ratings, and booking links

### Popular Destinations Recommendation

GlobeTrotter uses the Google Places API to provide personalized destination recommendations based on the user's location. When users grant location access, the application automatically detects their country and displays popular tourist destinations in that region.

**How It Works:**
1. User grants location permission on the dashboard
2. Application detects user's country via geolocation API
3. Fetches popular places using Google Places Text Search API
4. Displays top 6 destinations with images, ratings, and details
5. Users can click on destinations to start AI-powered trip planning

**Endpoint:** `GET /api/places/popular?country={countryName}`

**Implementation:**
- Uses Google Places API Text Search with query: "top tourist places in {country}"
- Retrieves place information including:
  - Place name and address
  - Ratings and reviews
  - Place types/categories
  - High-quality photos via Google Places Photo API
  - Place IDs for further details

**Response Structure:**
```json
{
  "places": [
    {
      "name": "Taj Mahal",
      "address": "Agra, Uttar Pradesh, India",
      "rating": 4.6,
      "types": ["tourist_attraction", "point_of_interest"],
      "imageUrl": "https://maps.googleapis.com/maps/api/place/photo?...",
      "placeId": "ChIJ..."
    }
  ]
}
```

**Features:**
- Automatic country detection via browser geolocation
- Location consent management with cookie storage
- Seamless integration with AI trip planning
- High-quality destination images
- User-friendly destination cards with ratings

**Configuration:**
Requires `GOOGLE_API_KEY` environment variable with Google Places API enabled. The API key must have the following APIs enabled:
- Places API (Text Search)
- Places API (Photo)

### Public Sharing

- Generate unique public URL slugs
- Share trips via public links
- Copy trips to user accounts
- View and copy statistics
- Browse public trips in community feed

### Calendar View

- Month view calendar
- Day-by-day activity display
- Color-coded by city/stop
- Navigation between months

### Admin Dashboard

- Platform analytics
- User statistics and management
- Popular destinations tracking
- Recent trips overview

---

## Admin Panel

The Admin Panel provides comprehensive platform management tools accessible only to users with admin privileges. It consists of two main sections: Analytics and User & Trip Management.

### Access Control

- **Route:** `/admin`
- **Authorization:** Only users with `is_admin: true` can access
- **API Protection:** All admin endpoints verify admin status and return 403 if unauthorized

### Analytics Dashboard

The analytics dashboard provides comprehensive insights into platform usage, user engagement, and content trends. Administrators can monitor key metrics and visualize data through interactive charts.

**Key Metrics:**
- **Total Users:** Count of all registered users with active users (last 30 days)
- **Total Trips:** Count of all trips with average trips per user
- **Total Views:** Aggregate view count across all public trips with copy statistics

**Visual Analytics:**
- **Trips Created Over Time:** Line chart showing daily trip creation trend (last 30 days)
- **Users Registered Over Time:** Line chart showing daily user registration trend (last 30 days)
- **Trip Distribution:** Pie chart showing public vs private trip distribution

**Additional Data:**
- Popular cities (top 10 by popularity score)
- Recent trips (latest 10 trips with creator information)
- Top activities (most used activities in itineraries)

![Admin Dashboard Analytics](https://github.com/user-attachments/assets/1811f06d-3e6b-4aa5-a558-a2001bd04db7)


The analytics view displays key platform statistics in an easy-to-read card format, with interactive charts showing trends over time. Administrators can quickly assess platform health and user engagement metrics.

**Endpoint:** `GET /api/admin/analytics`

**Response Structure:**
```json
{
  "stats": {
    "total_users": 1000,
    "total_trips": 5000,
    "total_cities": 200,
    "total_activities": 10000,
    "public_trips": 2000,
    "private_trips": 3000,
    "active_users": 500,
    "avg_trips_per_user": 5.0,
    "total_views": 50000,
    "total_copies": 1000
  },
  "popular_cities": [...],
  "recent_trips": [...],
  "trips_over_time": {...},
  "users_over_time": {...},
  "top_activities": [...]
}
```

### User Management

The user management interface provides administrators with comprehensive tools to manage platform users, including search, editing, and account status management.

**Features:**
- **Search:** Search users by email or full name
- **Pagination:** 20 users per page with navigation
- **User Actions:**
  - Edit user details (full name, language preference)
  - Toggle active/inactive status
  - Grant/revoke admin privileges
  - Delete user accounts (cannot delete own account)

**User Table Columns:**
- User profile (photo, name, language)
- Email address
- Active/Inactive status (toggleable)
- Admin/User role (toggleable)
- Join date
- Action buttons (edit, delete)

![Admin Dashboard Management](https://github.com/user-attachments/assets/85f04aa6-f1e5-4538-a4ce-7262a52a431c)

The management tab provides a comprehensive view of all users and trips on the platform. Administrators can search, filter, and manage user accounts with intuitive controls. The interface displays user information in a clean table format with quick action buttons for common tasks like editing user details or toggling account status.

**Endpoints:**
- `GET /api/admin/users` - List users with search and pagination
- `PUT /api/admin/users` - Update user details
- `DELETE /api/admin/users?user_id=X` - Delete user

**Update User Request:**
```json
{
  "user_id": 1,
  "full_name": "Updated Name",
  "is_active": true,
  "is_admin": false,
  "language_preference": "en"
}
```

### Trip Management

**Features:**
- **Search:** Search trips by name or description
- **Pagination:** 5 trips per page
- **Trip Information Display:**
  - Trip name (linked to trip detail page)
  - Description
  - Creator information
  - Creation date
  - View and copy counts
  - Public/Private status indicator

**Endpoint:** `GET /api/admin/trips`

**Query Parameters:**
- `search`: Search term
- `page`: Page number
- `limit`: Results per page

**Response:**
```json
{
  "trips": [
    {
      "trip_id": 1,
      "trip_name": "Trip Name",
      "trip_description": "Description",
      "is_public": true,
      "view_count": 100,
      "copy_count": 5,
      "users": {
        "user_id": 1,
        "email": "user@example.com",
        "full_name": "User Name"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 100,
    "totalPages": 20
  }
}
```

### Security Features

- **Admin Verification:** All endpoints check `is_admin` flag before processing
- **Self-Protection:** Admins cannot delete their own accounts
- **Error Handling:** Unauthorized access returns 403 with appropriate error messages
- **Session Validation:** Uses same authentication system as regular users

### UI Components

- Tab-based navigation (Analytics / Management)
- Responsive card layouts
- Interactive charts using Recharts
- Search functionality with real-time filtering
- Modal dialogs for user editing
- Pagination controls for large datasets

---

## AI Functionalities

GlobeTrotter uses OpenAI GPT-4.1-mini with web search to provide intelligent trip planning assistance.

### AI-Powered Trip Planning

**Endpoint:** `POST /api/trips/ai-plan`

Generates complete trip itineraries from user input.

**Request:**
```json
{
  "destination": "Paris, France",
  "budget": 100000,
  "startDate": "2024-06-01",
  "endDate": "2024-06-07",
  "originState": "Mumbai, Maharashtra"
}
```

**Process:**
1. User provides destination, budget (INR), dates, and origin
2. AI calculates trip duration and budget per day
3. Generates comprehensive plan with:
   - Transportation from origin to destination
   - Accommodation recommendations
   - Daily activities (2-4 per day)
   - All prices in Indian Rupees (INR)
4. Automatically saves trip to database
5. Redirects to trip builder for customization

**Features:**
- Automatic budget allocation (15-25% transport, 40-50% accommodation, 30-40% activities)
- Real-time web search for current prices
- Currency conversion to INR (1 USD ≈ 83 INR)
- Structured JSON output with travel, stay, and activity sections
- Price validation (all activities must have prices)

### AI Activity Search

**Endpoint:** `POST /api/trips/[tripId]/builder/search-activity`

Searches for activities by location and theme.

**Request:**
```json
{
  "place": "Paris, France",
  "theme": "lunch",
  "minPrice": 500,
  "maxPrice": 2000
}
```

**Response:**
```json
{
  "activities": [
    {
      "activity_name": "Restaurant Name",
      "price": "₹1,200-1,800",
      "price_numeric": 1500,
      "currency": "INR",
      "description": "Traditional French bistro",
      "category": "restaurant",
      "rating": 4.5,
      "address": "Street address"
    }
  ]
}
```

**Theme Examples:**
- lunch/dinner, adventure, culture, nightlife, shopping, sightseeing

### AI Stay Search

**Endpoint:** `POST /api/trips/[tripId]/builder/search-stay`

Finds accommodations with price and date filters.

**Request:**
```json
{
  "location": "Paris, France",
  "dateRange": "2024-06-01|2024-06-07",
  "minPrice": 2000,
  "maxPrice": 5000
}
```

### AI Transportation Search

**Endpoint:** `POST /api/trips/[tripId]/builder/search-transportation`

Finds transportation options between locations.

**Request:**
```json
{
  "from": "Mumbai, India",
  "to": "Paris, France"
}
```

**Response:**
```json
{
  "transportation_options": [
    {
      "mode": "flight",
      "provider": "Air India",
      "price": "₹45,000",
      "duration": "9h 30m"
    }
  ]
}
```

### AI Components

**AISearchModal** (`components/AISearchModal.tsx`):
- Unified interface for all AI searches
- Category-specific forms (travel, activity, stay)
- Price range filters
- Date range selection
- Real-time search with loading states

**AI Trip Plan Page** (`app/trips/ai-plan/page.tsx`):
- Destination selection
- Budget input (INR)
- Date range picker
- Automatic origin detection via geolocation
- Loading states and error handling

### Technical Details

**Model:** OpenAI GPT-4.1-mini with web search

**Response Processing:**
1. AI generates structured JSON
2. Removes markdown code blocks
3. Extracts JSON using regex
4. Validates structure
5. Transforms to application schema
6. Stores in database

**Price Management:**
- All prices in INR
- Currency conversion (USD to INR)
- Price validation and defaults
- Budget distribution calculations

**Configuration:**
```env
OPENAI_API_KEY=your_key
```

**Limitations:**
- API costs per request
- Response time: 10-30 seconds
- Prices may vary from actual booking sites
- Rate limits apply

---

## API Documentation

### Authentication

**POST /api/auth/signup**
```json
{
  "email": "user@example.com",
  "password": "password",
  "full_name": "John Doe"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**POST /api/auth/logout** - End session

**POST /api/auth/forgot-password** - Request reset email

**POST /api/auth/reset-password** - Reset with token

### Trips

**GET /api/trips** - Get user's trips

**POST /api/trips** - Create trip
```json
{
  "trip_name": "Trip Name",
  "trip_description": "Description",
  "start_date": "2024-06-01",
  "end_date": "2024-06-07",
  "total_budget": 100000,
  "is_public": false
}
```

**GET /api/trips/[tripId]** - Get trip details

**PUT /api/trips/[tripId]** - Update trip

**DELETE /api/trips/[tripId]** - Delete trip

**GET /api/trips/[tripId]/stops** - Get trip stops

**POST /api/trips/[tripId]/stops** - Add stop

**GET /api/trips/[tripId]/itinerary** - Get full itinerary

**GET /api/trips/[tripId]/budget** - Get budget breakdown

**POST /api/trips/[tripId]/copy** - Copy trip

**GET /api/trips/public/[slug]** - Get public trip

### Cities & Activities

**GET /api/cities** - Search cities
- Query: `search`, `region`, `limit`

**GET /api/activities** - Search activities
- Query: `city_id`, `category_id`, `min_cost`, `max_cost`

**GET /api/activities/categories** - Get categories

**GET /api/places/popular** - Get popular places for a country
- Query: `country` (required)
- Returns: List of popular tourist destinations with images, ratings, and details

### User

**GET /api/user/profile** - Get profile

**PUT /api/user/profile** - Update profile

**GET /api/user/saved-destinations** - Get saved destinations

**POST /api/user/saved-destinations** - Save destination

### Admin

**GET /api/admin/analytics** - Platform analytics (admin only)

**GET /api/admin/trips** - All trips (admin only)

**GET /api/admin/users** - All users (admin only)

---

## Development

### Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Production server
npm run lint     # Lint code
```

### Project Structure

```
app/
├── api/              # API route handlers
├── dashboard/        # Dashboard page
├── trips/           # Trip pages
├── login/           # Auth pages
└── ...

components/          # Reusable components
├── ui/              # UI primitives
└── ...

lib/                 # Utilities
├── supabase/        # Supabase clients
├── auth.ts          # Auth helpers
└── types.ts         # TypeScript types
```

### Architecture

**Flow:**
1. User request → Middleware (auth check)
2. Protected routes require authentication
3. API routes validate auth and query Supabase
4. Client components fetch data and update UI

**State Management:**
- React `useState` for local state
- Server Components for server-side data
- API routes for mutations
- URL params for filters

---

## Conclusion

GlobeTrotter is a comprehensive travel planning platform that combines modern web technologies with AI-powered assistance to provide users with an intuitive and powerful tool for planning multi-city trips. The application successfully addresses the complexities of travel planning by offering:

**Key Strengths:**
- **User-Friendly Interface:** Clean, responsive design built with Next.js and Tailwind CSS
- **AI Integration:** OpenAI-powered trip planning and activity search for intelligent recommendations
- **Comprehensive Features:** From budget tracking to itinerary building, all essential travel planning needs are covered
- **Scalable Architecture:** Built on Supabase for reliable backend services and PostgreSQL database
- **Security:** Robust authentication and authorization with admin panel for platform management
- **Community Features:** Public trip sharing and discovery capabilities

**Technical Highlights:**
- Server-side rendering with Next.js App Router for optimal performance
- Type-safe development with TypeScript
- Real-time data synchronization with Supabase
- Modern React patterns with Server and Client Components
- Comprehensive API structure for extensibility

**Use Cases:**
- Individual travelers planning personal trips
- Travel groups coordinating multi-city itineraries
- Travel bloggers sharing trip plans with audiences
- Travel agencies creating and managing client trips
- Platform administrators monitoring and managing the service

The platform is designed to grow with user needs, with a modular architecture that allows for easy feature additions and improvements. Whether you're planning a weekend getaway or a month-long multi-country adventure, GlobeTrotter provides the tools and intelligence to make trip planning efficient and enjoyable.

---
