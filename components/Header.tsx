"use client"
import { useEffect, useState } from "react"
import { getCurrentUser, signOut } from "aws-amplify/auth"
import Link from "next/link"

export default function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    window.location.href = "/"
  }

  return (
    <div className="bg-white border-b px-8 py-5 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-indigo-600">
        🛍️ My Marketplace
      </Link>
      <nav className="flex gap-4 items-center">
        <Link href="/products" className="text-gray-600 hover:text-indigo-600 text-sm">
          Products
        </Link>
        <Link href="/auctions" className="text-gray-600 hover:text-indigo-600 text-sm">
          Auctions
        </Link>
        {user ? (
          <>
            <span className="text-sm text-gray-500">{user.signInDetails?.loginId}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/signin" className="text-sm text-gray-600 hover:text-indigo-600">
              Sign in
            </Link>
            <Link href="/signup" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </div>
  )
}