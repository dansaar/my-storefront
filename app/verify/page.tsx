"use client"
import { useState, Suspense } from "react"
import { confirmSignUp } from "aws-amplify/auth"
import { useRouter, useSearchParams } from "next/navigation"

function VerifyForm() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get("email") || ""
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  const handleVerify = async () => {
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      router.push("/signin")
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm mb-6">We sent a code to {email}</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input
          className="w-full border rounded-lg px-4 py-2 mb-6 text-sm text-center text-2xl tracking-widest"
          placeholder="000000"
          value={code}
          onChange={e => setCode(e.target.value)}
          maxLength={6}
        />
        <button
          onClick={handleVerify}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          Verify email
        </button>
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}