'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { User, LogOut, Settings, Menu, X } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUser()
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      if (data.user) setUser(data.user)
    } catch (error) {
      // User not logged in or error
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Don't show navbar on auth pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password' || pathname === '/verify-email') {
    return null
  }

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img 
                src="/logo.png" 
                alt="GlobeTrotter" 
                className="h-16 w-auto"
              />
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname === '/dashboard'
                    ? 'bg-green-800 text-white'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-800'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/trips"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname.startsWith('/trips')
                    ? 'bg-green-800 text-white'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-800'
                }`}
              >
                My Trips
              </Link>
              <Link
                href="/community"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname.startsWith('/community')
                    ? 'bg-green-800 text-white'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-800'
                }`}
              >
                Community
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-green-50 transition-colors"
                >
                  {user.profile_photo_url ? (
                    <img
                      src={user.profile_photo_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-green-800"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-gray-200 z-50 overflow-hidden">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user.full_name || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-green-800 hover:bg-green-900 rounded-full transition-colors"
              >
                Login
              </Link>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-green-50 text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname === '/dashboard'
                    ? 'bg-green-800 text-white'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-800'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/trips"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname.startsWith('/trips')
                    ? 'bg-green-800 text-white'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-800'
                }`}
              >
                My Trips
              </Link>
              <Link
                href="/community"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname.startsWith('/community')
                    ? 'bg-green-800 text-white'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-800'
                }`}
              >
                Community
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
