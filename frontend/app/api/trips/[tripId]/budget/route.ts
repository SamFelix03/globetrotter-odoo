import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const supabase = await createClient()
    const { tripId } = await params

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

    // Get sections (itinerary items)
    const { data: sections } = await supabase
      .from('trip_sections')
      .select('category, price')
      .eq('trip_id', tripId)

    // Calculate estimated_cost from sections
    let estimatedCost = 0
    const sectionBreakdown: Record<string, any> = {
      'Travel': { category_name: 'Travel', total: 0, count: 0 },
      'Activity': { category_name: 'Activity', total: 0, count: 0 },
      'Stay': { category_name: 'Stay', total: 0, count: 0 },
    }

    sections?.forEach((section: any) => {
      const price = parseFloat(section.price || 0)
      if (!isNaN(price) && price > 0) {
        estimatedCost += price
        
        // Map category to display name
        let categoryName = 'Other'
        if (section.category === 'travel') categoryName = 'Travel'
        else if (section.category === 'activity') categoryName = 'Activity'
        else if (section.category === 'stay') categoryName = 'Stay'
        
        if (!sectionBreakdown[categoryName]) {
          sectionBreakdown[categoryName] = {
            category_name: categoryName,
            total: 0,
            count: 0,
          }
        }
        sectionBreakdown[categoryName].total += price
        sectionBreakdown[categoryName].count += 1
      }
    })

    // Get expense breakdown by category (for actual expenses, separate from estimated)
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

    // Calculate expense breakdown
    const expenseBreakdown: Record<string, any> = {}
    let totalExpenses = 0

    expenses?.forEach((expense: any) => {
      const categoryName = expense.expense_categories?.category_name || 'Other'
      if (!expenseBreakdown[categoryName]) {
        expenseBreakdown[categoryName] = {
          category_name: categoryName,
          color_code: expense.expense_categories?.color_code || '#607D8B',
          icon_name: expense.expense_categories?.icon_name || 'misc',
          total: 0,
          count: 0,
          expenses: []
        }
      }
      expenseBreakdown[categoryName].total += parseFloat(expense.amount || 0)
      expenseBreakdown[categoryName].count += 1
      expenseBreakdown[categoryName].expenses.push(expense)
      totalExpenses += parseFloat(expense.amount || 0)
    })

    // Use section breakdown for the pie chart (estimated costs from itinerary)
    const breakdown = Object.values(sectionBreakdown).filter((item: any) => item.total > 0)

    // Calculate days
    const startDate = new Date(trip.start_date)
    const endDate = new Date(trip.end_date)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Calculate avg/day from estimated_cost
    const avgCostPerDay = days > 0 ? estimatedCost / days : 0

    return NextResponse.json({
      trip_id: tripId,
      total_budget: trip.total_budget,
      estimated_cost: estimatedCost, // Calculated from sections
      total_expenses: totalExpenses, // Actual expenses (separate)
      days,
      avg_cost_per_day: avgCostPerDay,
      breakdown: breakdown, // Breakdown by section categories
      is_over_budget: trip.total_budget ? estimatedCost > trip.total_budget : false
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

