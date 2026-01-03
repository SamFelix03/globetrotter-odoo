import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const city_id = searchParams.get('city_id')
    const category_id = searchParams.get('category_id')
    const search = searchParams.get('search')
    const min_cost = searchParams.get('min_cost')
    const max_cost = searchParams.get('max_cost')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('activities')
      .select(`
        *,
        activity_categories:category_id (
          category_id,
          category_name,
          icon_name
        ),
        cities:city_id (
          city_id,
          city_name,
          country
        )
      `)
      .eq('is_active', true)
      .range(offset, offset + limit - 1)

    if (city_id) {
      query = query.eq('city_id', city_id)
    }

    if (category_id) {
      query = query.eq('category_id', category_id)
    }

    if (search) {
      query = query.ilike('activity_name', `%${search}%`)
    }

    if (min_cost) {
      query = query.gte('estimated_cost', min_cost)
    }

    if (max_cost) {
      query = query.lte('estimated_cost', max_cost)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ activities: data || [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

