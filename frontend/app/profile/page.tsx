'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ImageUploadModal from '@/components/ImageUploadModal'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [savedDestinations, setSavedDestinations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    profile_photo_url: '',
    language_preference: 'en',
  })

  useEffect(() => {
    fetchProfile()
    fetchSavedDestinations()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      setUser(data.user)
      setFormData({
        full_name: data.user?.full_name || '',
        profile_photo_url: data.user?.profile_photo_url || '',
        language_preference: data.user?.language_preference || 'en',
      })
      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setLoading(false)
    }
  }

  const fetchSavedDestinations = async () => {
    try {
      const res = await fetch('/api/user/saved-destinations')
      const data = await res.json()
      setSavedDestinations(data.destinations || [])
    } catch (error) {
      console.error('Error fetching saved destinations:', error)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        fetchProfile()
        setEditing(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Profile & Settings</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
              >
                Edit
              </button>
            )}
          </div>

          {/* Profile Photo Display (when not editing) */}
          {!editing && (
            <div className="flex justify-center mb-6">
              {user?.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt="Profile"
                  className="w-32 h-32 object-cover rounded-full border-2 border-gray-300 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 text-4xl">👤</span>
                </div>
              )}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                  Profile Photo
                </label>
                {formData.profile_photo_url && (
                  <div className="mb-4">
                    <img
                      src={formData.profile_photo_url}
                      alt="Profile preview"
                      className="w-32 h-32 object-cover rounded-full border-2 border-gray-300 dark:border-gray-700 mx-auto"
                    />
                  </div>
                )}
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="px-4 py-2 text-sm font-medium text-green-800 dark:text-green-700 border border-green-800 dark:border-blue-400 rounded-md hover:bg-green-50 dark:hover:bg-blue-900/20"
                  >
                    {formData.profile_photo_url ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {formData.profile_photo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profile_photo_url: '' })}
                      className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language Preference
                </label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                  value={formData.language_preference}
                  onChange={(e) => setFormData({ ...formData, language_preference: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    fetchProfile()
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-2">Email</label>
                <div className="mt-1 text-gray-900 dark:text-white text-center">{user?.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-2">Full Name</label>
                <div className="mt-1 text-gray-900 dark:text-white text-center">{user?.full_name || 'Not set'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-2">Language</label>
                <div className="mt-1 text-gray-900 dark:text-white text-center">{user?.language_preference || 'en'}</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Saved Destinations</h2>
          {savedDestinations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No saved destinations yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedDestinations.map((dest) => (
                <div key={dest.saved_destination_id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {dest.cities?.city_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{dest.cities?.country}</p>
                  {dest.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{dest.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onUploadSuccess={(url) => {
          setFormData({ ...formData, profile_photo_url: url })
          setShowImageModal(false)
        }}
        folder="profiles"
        currentImageUrl={formData.profile_photo_url}
        title="Upload Profile Photo"
      />
    </div>
  )
}

