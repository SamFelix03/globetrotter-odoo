import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createClient()
    const { tripId } = params

    // Get trip details
    const { data: trip } = await supabase
      .from('trips')
      .select('start_date, end_date, total_budget, estimated_cost')
      .eq('trip_id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Get expense breakdown by category
    const { data: expenses } = await supabase
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

    // Calculate breakdown
    const breakdown: Record<string, any> = {}
    let totalExpenses = 0

    expenses?.forEach((expense: any) => {
      const categoryName = expense.expense_categories?.category_name || 'Other'
      if (!breakdown[categoryName]) {
        breakdown[categoryName] = {
          category_name: categoryName,
          color_code: expense.expense_categories?.color_code || '#607D8B',
          icon_name: expense.expense_categories?.icon_name || 'misc',
          total: 0,
          count: 0,
          expenses: []
        }
      }
      breakdown[categoryName].total += parseFloat(expense.amount || 0)
      breakdown[categoryName].count += 1
      breakdown[categoryName].expenses.push(expense)
      totalExpenses += parseFloat(expense.amount || 0)
    })

    // Calculate days
    const startDate = new Date(trip.start_date)
    const endDate = new Date(trip.end_date)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const avgCostPerDay = days > 0 ? totalExpenses / days : 0

    return NextResponse.json({
      trip_id: tripId,
      total_budget: trip.total_budget,
      estimated_cost: trip.estimated_cost || totalExpenses,
      total_expenses: totalExpenses,
      days,
      avg_cost_per_day: avgCostPerDay,
      breakdown: Object.values(breakdown),
      is_over_budget: trip.total_budget ? totalExpenses > trip.total_budget : false
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

