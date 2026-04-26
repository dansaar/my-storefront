"use client"
import { useEffect, useState } from "react"
import { getCurrentUser } from "aws-amplify/auth"
import Header from "@/components/Header"
import { useRouter } from "next/navigation"

const ADMIN_EMAIL = "dansaar52@gmail.com" // your email

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUser()
      .then(async (u) => {
        if (u.signInDetails?.loginId !== ADMIN_EMAIL) {
          router.push('/')
          return
        }
        fetchUsers()
      })
      .catch(() => router.push('/signin'))
  }, [])

  const fetchUsers = async () => {
    const res = await fetch(`/api/users`)
    const data = await res.json()
    setUsers(data.users || [])
  }

  const updateRole = async (userId: string, role: string) => {
    setLoading(userId)
    const res = await fetch(`/api/users/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role })
    })
    const data = await res.json()
    if (data.success) {
      setMessage(`✅ User updated to ${role}`)
      fetchUsers()
    } else {
      setMessage("❌ Failed to update role")
    }
    setLoading(null)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8">Manage users and seller roles</p>

        {message && (
          <p className={`text-sm mb-6 px-4 py-3 rounded-lg ${
            message.includes('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}>
            {message}
          </p>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            All Users ({users.length})
          </h2>
          <div className="flex flex-col gap-3">
            {users.map((u: any) => (
              <div key={u.id} className="flex justify-between items-center py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{u.name || u.email}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    u.role === 'seller'
                      ? 'bg-green-100 text-green-600'
                      : u.role === 'admin'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {u.role}
                  </span>
                  {u.role === 'buyer' && (
                    <button
                      onClick={() => updateRole(u.id, 'seller')}
                      disabled={loading === u.id}
                      className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {loading === u.id ? 'Updating...' : 'Make seller'}
                    </button>
                  )}
                  {u.role === 'seller' && (
                    <button
                      onClick={() => updateRole(u.id, 'buyer')}
                      disabled={loading === u.id}
                      className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {loading === u.id ? 'Updating...' : 'Remove seller'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}