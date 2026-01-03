import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createClient()
    const { tripId } = params

    const { data, error } = await supabase
      .from('trip_expenses')
      .select(`
        *,
        expense_categories:expense_category_id (
          expense_category_id,
          category_name,
          color_code,
          icon_name
        )
      `)
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ expenses: data || [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = await createClient()
    const { tripId } = params
    const body = await request.json()

    const { stop_id, day_id, expense_category_id, amount, currency_code, description, expense_date, is_estimated } = body

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('trip_expenses')
      .insert({
        trip_id: parseInt(tripId),
        stop_id: stop_id || null,
        day_id: day_id || null,
        expense_category_id: expense_category_id || null,
        amount,
        currency_code: currency_code || 'USD',
        description: description || null,
        expense_date: expense_date || null,
        is_estimated: is_estimated !== undefined ? is_estimated : true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ expense: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

