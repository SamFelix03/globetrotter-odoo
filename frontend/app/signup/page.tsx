'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import ImageUploadModal from '@/components/ImageUploadModal'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img 
            src="/logo.png" 
            alt="GlobeTrotter" 
            className="h-30 w-auto"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Enter your information below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                    <p className="font-semibold">Account created successfully!</p>
                    <p className="mt-2">We&apos;ve sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to activate your account.</p>
                    <p className="mt-2">Once verified, you can sign in.</p>
                  </div>
                )}
                {error && (
                  <FieldError className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </FieldError>
                )}
                
                {/* Profile Photo Upload - At the top */}
                <Field>
                  <div className="flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowImageModal(true)}
                      className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 bg-gray-100 hover:border-green-800 transition-colors"
                    >
                      {profilePhotoUrl ? (
                        <img
                          src={profilePhotoUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-10 h-10 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowImageModal(true)}
                        className="text-sm text-green-800 hover:text-green-900 font-medium"
                      >
                        {profilePhotoUrl ? 'Change photo' : 'Add photo'}
                      </button>
                      {profilePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setProfilePhotoUrl('')}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="full-name">Name</FieldLabel>
                  <Input
                    id="full-name"
                    name="full-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </Field>
                <Field>
                  <Label htmlFor="language" className="text-sm font-medium">
                    Preferred Language
                  </Label>
                  <select
                    id="language"
                    name="language"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                </Field>
                <Field>
                  <Button type="submit" disabled={loading || success} className="w-full">
                    {loading ? 'Creating account...' : success ? 'Check your email' : 'Sign up'}
                  </Button>
                  {success && (
                    <FieldDescription className="text-center">
                      <Link href="/login" className="text-green-800 hover:underline">
                        Go to login page →
                      </Link>
                    </FieldDescription>
                  )}
                  <FieldDescription className="text-center">
                    Already have an account?{' '}
                    <Link href="/login" className="text-green-800 hover:underline">
                      Sign in
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

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
