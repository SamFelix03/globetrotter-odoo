# GlobeTrotter - Multi-City Trip Planner

A comprehensive travel planning application built with Next.js and Supabase that allows users to create, manage, and share multi-city travel itineraries.

## Features

### Authentication
- User signup and login
- Password reset functionality
- User profile management

### Trip Management
- Create and manage multiple trips
- Set trip dates, budgets, and descriptions
- Upload cover photos
- Make trips public or private

### Itinerary Builder
- Add multiple cities (stops) to a trip
- Plan day-by-day activities
- Search and add activities from a catalog
- Create custom activities
- Reorder cities and activities

### City & Activity Search
- Search cities by name or country
- Filter cities by region
- Browse activities by city
- Filter activities by category, cost, and duration
- View activity details and booking links

### Budget Tracking
- Set total trip budget
- Automatic cost estimation
- Expense breakdown by category
- Visual charts (pie and bar charts)
- Average cost per day calculation
- Budget alerts

### Calendar & Timeline
- Calendar view of trip itinerary
- Day-by-day timeline view
- Visual representation of activities

### Sharing
- Share trips publicly via unique URL
- Copy trips from other users
- View public trip statistics

### User Profile
- Edit profile information
- Save favorite destinations
- Language preferences

### Admin Dashboard (Optional)
- Platform analytics
- User statistics
- Popular destinations
- Recent trips

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- PostgreSQL database (via Supabase)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `supabase_schema.sql` in your Supabase SQL editor
3. Get your Supabase URL and anon key from Project Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/
│   ├── api/              # API routes for backend operations
│   │   ├── auth/         # Authentication endpoints
│   │   ├── trips/        # Trip management endpoints
│   │   ├── cities/       # City search endpoints
│   │   ├── activities/   # Activity search endpoints
│   │   ├── user/         # User profile endpoints
│   │   └── admin/        # Admin analytics endpoints
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── dashboard/        # Dashboard/home page
│   ├── trips/            # Trip management pages
│   ├── cities/           # City search page
│   ├── activities/       # Activity search page
│   ├── profile/          # User profile page
│   └── admin/            # Admin dashboard
├── components/           # Reusable React components
├── lib/                  # Utility functions and configurations
│   ├── supabase/         # Supabase client setup
│   ├── auth.ts           # Authentication helpers
│   └── types.ts          # TypeScript type definitions
└── public/               # Static assets
```

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset

### Trips
- `GET /api/trips` - Get user's trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/[tripId]` - Get trip details
- `PUT /api/trips/[tripId]` - Update trip
- `DELETE /api/trips/[tripId]` - Delete trip
- `GET /api/trips/[tripId]/stops` - Get trip stops
- `POST /api/trips/[tripId]/stops` - Add stop
- `GET /api/trips/[tripId]/itinerary` - Get full itinerary
- `GET /api/trips/[tripId]/budget` - Get budget breakdown
- `GET /api/trips/[tripId]/expenses` - Get expenses
- `POST /api/trips/[tripId]/copy` - Copy trip
- `GET /api/trips/public/[slug]` - Get public trip

### Cities & Activities
- `GET /api/cities` - Search cities
- `GET /api/activities` - Search activities
- `GET /api/activities/categories` - Get activity categories

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/saved-destinations` - Get saved destinations
- `POST /api/user/saved-destinations` - Save destination

### Admin
- `GET /api/admin/analytics` - Get platform analytics

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- `users` - User accounts
- `cities` - City master data
- `activities` - Activity catalog
- `trips` - User trips
- `trip_stops` - Cities in a trip
- `itinerary_days` - Days in a stop
- `itinerary_activities` - Activities in a day
- `trip_expenses` - Trip expenses
- `saved_destinations` - User saved destinations

See `supabase_schema.sql` for the complete schema.

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Notes

- The application uses Supabase Auth for authentication, but also maintains a custom `users` table for additional user data
- Password hashing is done using bcryptjs
- All API routes are server-side and use Supabase server client
- The frontend uses client components for interactivity
- Charts are rendered using Recharts library

## Future Enhancements

- Real-time collaboration on trips
- Trip templates
- Social features (likes, comments)
- Mobile app
- Email notifications
- Integration with booking services
- Weather integration
- Map visualization

## License

This project is created for a hackathon/educational purposes.
