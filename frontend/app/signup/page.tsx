'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUploadModal from '@/components/ImageUploadModal'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [languagePreference, setLanguagePreference] = useState('en')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName,
          language_preference: languagePreference,
          profile_photo_url: profilePhotoUrl || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        setLoading(false)
        return
      }

      // Show success message
      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link href="/login" className="font-medium text-green-800 hover:text-green-800">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
              <p className="font-semibold">Account created successfully!</p>
              <p className="mt-2">We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to activate your account.</p>
              <p className="mt-2">Once verified, you can sign in.</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="full-name" className="sr-only">
                Full Name
              </label>
              <input
                id="full-name"
                name="full-name"
                type="text"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm"
                placeholder="Full Name (optional)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Language (optional)
              </label>
              <select
                id="language"
                name="language"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm"
                value={languagePreference}
                onChange={(e) => setLanguagePreference(e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Photo (optional)
              </label>
              <div className="flex items-center gap-4">
                {profilePhotoUrl && (
                  <img
                    src={profilePhotoUrl}
                    alt="Profile preview"
                    className="w-16 h-16 object-cover rounded-full border-2 border-gray-300 dark:border-gray-700"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className="px-4 py-2 text-sm font-medium text-green-800 border border-green-800 rounded-md hover:bg-green-50"
                >
                  {profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {profilePhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setProfilePhotoUrl('')}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-800 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-800 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : success ? 'Check your email' : 'Sign up'}
            </button>
          </div>
          {success && (
            <div className="text-center">
              <Link href="/login" className="font-medium text-green-800 hover:text-green-900">
                Go to login page →
              </Link>
            </div>
          )}
        </form>

        <ImageUploadModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          onUploadSuccess={(url) => {
            setProfilePhotoUrl(url)
            setShowImageModal(false)
          }}
          folder="profiles"
          currentImageUrl={profilePhotoUrl}
          title="Upload Profile Photo"
        />
      </div>
    </div>
  )
}

