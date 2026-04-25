"use client"
import { useState } from "react"
import { signUp } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSignUp = async () => {
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email, name }
        }
      })
      router.push(`/verify?email=${encodeURIComponent(email)}`)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create account</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input
          className="w-full border rounded-lg px-4 py-2 mb-3 text-sm"
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
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
          onClick={handleSignUp}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          Sign up
        </button>
        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account?{" "}
          <a href="/signin" className="text-indigo-600">Sign in</a>
        </p>
      </div>
    </main>
  )
}