'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const res = await fetch('/api/auth/verify-email')
        const data = await res.json()

        if (res.ok && data.verified) {
          setVerified(true)
        } else {
          setError(data.error || 'Unable to verify email')
        }
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
        setLoading(false)
      }
    }

    // Check if we came from the callback with verified=true
    const fromCallback = searchParams.get('verified')
    if (fromCallback === 'true') {
      setVerified(true)
      setLoading(false)
    } else {
      checkVerification()
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Verifying email...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {verified ? 'Email Verified!' : 'Email Verification'}
          </h2>
        </div>

        {verified ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-400 px-4 py-3 rounded">
            <p className="text-center mb-4">
              Your email has been successfully verified! You can now sign in to your account.
            </p>
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-800 hover:bg-green-900"
              >
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            <p className="text-center mb-4">
              {error || 'Email verification is still pending. Please check your inbox and click the verification link.'}
            </p>
            <div className="text-center space-y-2">
              <p className="text-sm">Didn't receive the email?</p>
              <Link
                href="/login"
                className="text-green-800 hover:text-green-800 font-medium"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

