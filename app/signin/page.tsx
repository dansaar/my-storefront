"use client"
import { useState } from "react"
import { signIn, getCurrentUser } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signIn({ username: email, password })
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
      return
    }

    try {
      const { userId, signInDetails } = await getCurrentUser()
      await fetch(`/api/sync-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          email: signInDetails?.loginId,
          name: signInDetails?.loginId?.split("@")[0]
        })
      })
    } catch (e) {
      console.error("Sync failed:", e)
    }

    setLoading(false)
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sign in</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input
          className="w-full border rounded-lg px-4 py-2 mb-3 text-sm"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-4 py-2 mb-6 text-sm"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-sm text-center text-gray-500 mt-4">
          No account?{" "}
          <a href="/signup" className="text-indigo-600">Sign up</a>
        </p>
      </div>
    </main>
  )
}