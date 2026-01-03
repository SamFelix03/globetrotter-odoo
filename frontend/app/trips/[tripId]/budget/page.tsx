'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function BudgetPage() {
  const params = useParams()
  const tripId = params.tripId as string
  const [budget, setBudget] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudget()
    fetchExpenses()
  }, [tripId])

  const fetchBudget = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/budget`)
      const data = await res.json()
      setBudget(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching budget:', error)
      setLoading(false)
    }
  }

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`)
      const data = await res.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!budget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Budget data not found</div>
      </div>
    )
  }

  const pieData = budget.breakdown?.map((item: any) => ({
    name: item.category_name,
    value: item.total,
  })) || []

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/trips/${tripId}`} className="text-green-800 hover:text-green-900">
            ← Back to Trip
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Budget & Cost Breakdown</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Budget</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{budget.total_budget?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Estimated Cost</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{budget.estimated_cost?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Days</div>
              <div className="text-2xl font-bold text-gray-900">{budget.days || 0}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Avg/Day</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{budget.avg_cost_per_day?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          {budget.is_over_budget && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              ⚠️ You are over budget!
            </div>
          )}

          {pieData.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Expenses by Category</h2>
            <div className="space-y-2">
              {budget.breakdown?.map((item: any) => (
                <div key={item.category_name} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">{item.category_name}</div>
                    <div className="text-sm text-gray-600">{item.count} expenses</div>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    ${item.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

