'use client'

import { useEffect, useState } from 'react'
import { formatDateDDMMYYYY } from '@/lib/dateUtils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Users, MapPin, Eye, Shield, Search, Edit, Trash2, X } from 'lucide-react'

interface User {
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

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    fetchAnalytics()
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, currentPage])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) {
        if (res.status === 403) {
          alert('You are not authorized to access this page')
          window.location.href = '/dashboard'
          return
        }
      }
      const data = await res.json()
      setAnalytics(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch(`/api/admin/users?search=${searchTerm}&page=${currentPage}&limit=20`)
      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleUpdateUser = async (user: User) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })
      if (!res.ok) throw new Error('Failed to update user')
      await fetchUsers()
      setShowUserModal(false)
      setEditingUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    try {
      const res = await fetch(`/api/admin/users?user_id=${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }
      await fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(error.message || 'Failed to delete user')
    }
  }

  const handleToggleAdmin = async (user: User) => {
    const updatedUser = { ...user, is_admin: !user.is_admin }
    await handleUpdateUser(updatedUser)
  }

  const handleToggleActive = async (user: User) => {
    const updatedUser = { ...user, is_active: !user.is_active }
    await handleUpdateUser(updatedUser)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-lg text-gray-600">Unable to load analytics</div>
      </div>
    )
  }

  // Prepare chart data
  const tripsOverTimeData = Object.entries(analytics.trips_over_time || {})
    .map(([date, count]) => ({ date, trips: count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const usersOverTimeData = Object.entries(analytics.users_over_time || {})
    .map(([date, count]) => ({ date, users: count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const tripDistributionData = [
    { name: 'Public', value: analytics.stats.public_trips || 0 },
    { name: 'Private', value: analytics.stats.private_trips || 0 },
  ]

  const COLORS = ['#166534', '#22c55e', '#4ade80', '#86efac']

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Platform analytics and user management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-green-800" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{analytics.stats.total_users}</div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.stats.active_users} active (last 30 days)
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Trips</CardTitle>
              <MapPin className="h-4 w-4 text-green-800" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{analytics.stats.total_trips}</div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.stats.avg_trips_per_user} avg per user
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-green-800" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{analytics.stats.total_views?.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.stats.total_copies} copies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trips Over Time */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Trips Created (Last 30 Days)</CardTitle>
              <CardDescription>Daily trip creation trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ trips: { label: 'Trips', color: '#166534' } }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tripsOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="trips" 
                      stroke="#166534" 
                      strokeWidth={2}
                      dot={{ fill: '#166534', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Users Over Time */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Users Registered (Last 30 Days)</CardTitle>
              <CardDescription>Daily user registration trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ users: { label: 'Users', color: '#166534' } }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usersOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#166534" 
                      strokeWidth={2}
                      dot={{ fill: '#166534', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trip Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Trip Distribution</CardTitle>
              <CardDescription>Public vs Private trips</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ 
                public: { label: 'Public', color: '#166534' },
                private: { label: 'Private', color: '#22c55e' }
              }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tripDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tripDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Trips</CardTitle>
              <CardDescription>Latest trips created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recent_trips?.map((trip: any) => (
                  <div key={trip.trip_id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{trip.trip_name}</div>
                    <div className="text-sm text-gray-600">
                      by {trip.users?.full_name || 'Unknown'} • {formatDateDDMMYYYY(trip.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">User Management</CardTitle>
            <CardDescription>Manage platform users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-8 text-gray-600">Loading users...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">User</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Joined</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {user.profile_photo_url ? (
                                <img
                                  src={user.profile_photo_url}
                                  alt={user.full_name || user.email}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-white text-sm font-semibold">
                                  {(user.full_name || user.email)[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.full_name || 'No name'}
                                </div>
                                <div className="text-xs text-gray-500">{user.language_preference}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleAdmin(user)}
                              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                user.is_admin
                                  ? 'bg-green-800 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {user.is_admin && <Shield className="h-3 w-3" />}
                              {user.is_admin ? 'Admin' : 'User'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDateDDMMYYYY(user.created_at)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user)
                                  setShowUserModal(true)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.user_id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No users found</div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-2 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Edit User</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowUserModal(false)
                  setEditingUser(null)
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <Input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language Preference</label>
                <Input
                  type="text"
                  value={editingUser.language_preference}
                  onChange={(e) => setEditingUser({ ...editingUser, language_preference: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUserModal(false)
                    setEditingUser(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateUser(editingUser)}
                  className="flex-1 bg-green-800 hover:bg-green-900"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
