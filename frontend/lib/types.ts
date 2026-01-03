export interface User {
  user_id: number
  email: string
  full_name: string | null
  profile_photo_url: string | null
  language_preference: string
  created_at: string
  updated_at: string
  is_active: boolean
  is_admin: boolean
}

export interface City {
  city_id: number
  city_name: string
  country: string
  region: string | null
  latitude: number | null
  longitude: number | null
  cost_index: number | null
  popularity_score: number
  timezone: string | null
  currency_code: string | null
  description: string | null
  cover_image_url: string | null
  created_at: string
}

export interface ActivityCategory {
  category_id: number
  category_name: string
  icon_name: string | null
  display_order: number
}

export interface Activity {
  activity_id: number
  city_id: number
  category_id: number | null
  activity_name: string
  description: string | null
  estimated_cost: number | null
  estimated_duration: number | null
  difficulty_level: string | null
  image_url: string | null
  booking_url: string | null
  rating: number | null
  review_count: number
  is_active: boolean
  created_at: string
}

export interface Trip {
  trip_id: number
  user_id: number
  trip_name: string
  trip_description: string | null
  start_date: string
  end_date: string
  cover_photo_url: string | null
  total_budget: number | null
  estimated_cost: number | null
  is_public: boolean
  public_url_slug: string | null
  view_count: number
  copy_count: number
  created_at: string
  updated_at: string
}

export interface TripStop {
  stop_id: number
  trip_id: number
  city_id: number
  stop_order: number
  arrival_date: string
  departure_date: string
  accommodation_name: string | null
  accommodation_cost: number | null
  accommodation_url: string | null
  transport_to_next_stop: string | null
  transport_cost: number | null
  notes: string | null
  created_at: string
}

export interface ItineraryDay {
  day_id: number
  stop_id: number
  day_date: string
  day_number: number
  notes: string | null
  created_at: string
}

export interface ItineraryActivity {
  itinerary_activity_id: number
  day_id: number
  activity_id: number | null
  activity_order: number
  custom_activity_name: string | null
  custom_description: string | null
  start_time: string | null
  end_time: string | null
  actual_cost: number | null
  actual_duration: number | null
  booking_reference: string | null
  status: string
  notes: string | null
  created_at: string
}

export interface ExpenseCategory {
  expense_category_id: number
  category_name: string
  icon_name: string | null
  color_code: string | null
}

export interface TripExpense {
  expense_id: number
  trip_id: number
  stop_id: number | null
  day_id: number | null
  expense_category_id: number | null
  amount: number
  currency_code: string
  description: string | null
  expense_date: string | null
  is_estimated: boolean
  created_at: string
}

