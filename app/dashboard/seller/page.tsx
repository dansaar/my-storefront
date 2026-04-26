"use client"
import { useEffect, useState } from "react"
import { getCurrentUser } from "aws-amplify/auth"
import Header from "@/components/Header"
import { useRouter } from "next/navigation"

export default function SellerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userDb, setUserDb] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [auctions, setAuctions] = useState<any[]>([])
  const [tab, setTab] = useState<"products" | "auctions">("products")
  const [message, setMessage] = useState("")

  // Product form
  const [pName, setPName] = useState("")
  const [pDesc, setPDesc] = useState("")
  const [pPrice, setPPrice] = useState("")

  // Auction form
  const [aTitle, setATitle] = useState("")
  const [aDesc, setADesc] = useState("")
  const [aStartPrice, setAStartPrice] = useState("")
  const [aReservePrice, setAReservePrice] = useState("")
  const [aType, setAType] = useState("timed")
  const [aEndTime, setAEndTime] = useState("")
  const [aDays, setADays] = useState("1")

  useEffect(() => {
    getCurrentUser()
      .then(async (u) => {
        setUser(u)
        // Check if user is a seller
        const res = await fetch(`/api/users`)
        const data = await res.json()
        const dbUser = data.users?.find((x: any) => x.id === u.userId)
        setUserDb(dbUser)
        if (dbUser?.role !== 'seller') {
          router.push('/')
          return
        }
        fetchData(u.userId)
      })
      .catch(() => router.push('/signin'))
  }, [])

  const fetchData = async (userId: string) => {
    const [pRes, aRes] = await Promise.all([
      fetch(`/api/products`),
      fetch(`/api/auctions`)
    ])
    const pData = await pRes.json()
    const aData = await aRes.json()
    setProducts(pData.products?.filter((p: any) => p.seller_id === userId) || [])
    setAuctions(aData.auctions?.filter((a: any) => a.seller_id === userId) || [])
  }

  const createProduct = async () => {
    if (!pName || !pPrice) return setMessage("❌ Name and price are required")
    const res = await fetch(`/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pName,
        description: pDesc,
        price: parseFloat(pPrice),
        seller_id: user.userId
      })
    })
    const data = await res.json()
    if (data.product) {
      setMessage("✅ Product created!")
      setPName(""); setPDesc(""); setPPrice("")
      fetchData(user.userId)
    } else {
      setMessage("❌ Failed to create product")
    }
  }

  const createAuction = async () => {
    if (!aTitle || !aStartPrice) return setMessage("❌ Title and starting price are required")
    const endTime = new Date()
    endTime.setDate(endTime.getDate() + parseInt(aDays))
    const res = await fetch(`/api/auctions/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: aTitle,
        description: aDesc,
        starting_price: parseFloat(aStartPrice),
        reserve_price: aReservePrice ? parseFloat(aReservePrice) : null,
        type: aType,
        end_time: endTime.toISOString(),
        seller_id: user.userId
      })
    })
    const data = await res.json()
    if (data.auction) {
      setMessage("✅ Auction created!")
      setATitle(""); setADesc(""); setAStartPrice(""); setAReservePrice("")
      fetchData(user.userId)
    } else {
      setMessage("❌ Failed to create auction")
    }
  }

  if (!userDb) return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto px-8 py-20 text-center text-gray-400">
        Loading...
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Seller Dashboard</h1>
        <p className="text-gray-500 mb-8">Welcome, {userDb.name || userDb.email}</p>

        {message && (
          <p className={`text-sm mb-6 px-4 py-3 rounded-lg ${
            message.includes('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}>
            {message}
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab("products")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === "products"
                ? "bg-indigo-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setTab("auctions")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === "auctions"
                ? "bg-indigo-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            Auctions ({auctions.length})
          </button>
        </div>

        {/* Products Tab */}
        {tab === "products" && (
          <div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Create Product</h2>
              <div className="flex flex-col gap-4">
                <input
                  className="border rounded-lg px-4 py-2 text-sm"
                  placeholder="Product name"
                  value={pName}
                  onChange={e => setPName(e.target.value)}
                />
                <textarea
                  className="border rounded-lg px-4 py-2 text-sm"
                  placeholder="Description"
                  rows={3}
                  value={pDesc}
                  onChange={e => setPDesc(e.target.value)}
                />
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                  <input
                    className="border rounded-lg pl-7 pr-4 py-2 text-sm w-full"
                    placeholder="Price"
                    type="number"
                    value={pPrice}
                    onChange={e => setPPrice(e.target.value)}
                  />
                </div>
                <button
                  onClick={createProduct}
                  className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Create product
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Products ({products.length})
              </h2>
              {products.length === 0 ? (
                <p className="text-gray-400 text-sm">No products yet — create your first one above!</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {products.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.description}</p>
                      </div>
                      <span className="text-lg font-bold text-indigo-600">${p.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auctions Tab */}
        {tab === "auctions" && (
          <div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Create Auction</h2>
              <div className="flex flex-col gap-4">
                <input
                  className="border rounded-lg px-4 py-2 text-sm"
                  placeholder="Auction title"
                  value={aTitle}
                  onChange={e => setATitle(e.target.value)}
                />
                <textarea
                  className="border rounded-lg px-4 py-2 text-sm"
                  placeholder="Description"
                  rows={3}
                  value={aDesc}
                  onChange={e => setADesc(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                    <input
                      className="border rounded-lg pl-7 pr-4 py-2 text-sm w-full"
                      placeholder="Starting price"
                      type="number"
                      value={aStartPrice}
                      onChange={e => setAStartPrice(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                    <input
                      className="border rounded-lg pl-7 pr-4 py-2 text-sm w-full"
                      placeholder="Reserve price (optional)"
                      type="number"
                      value={aReservePrice}
                      onChange={e => setAReservePrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="border rounded-lg px-4 py-2 text-sm"
                    value={aType}
                    onChange={e => setAType(e.target.value)}
                  >
                    <option value="timed">⏱ Timed auction</option>
                    <option value="live">🔴 Live auction</option>
                  </select>
                  <select
                    className="border rounded-lg px-4 py-2 text-sm"
                    value={aDays}
                    onChange={e => setADays(e.target.value)}
                  >
                    <option value="1">Ends in 1 day</option>
                    <option value="3">Ends in 3 days</option>
                    <option value="7">Ends in 7 days</option>
                    <option value="14">Ends in 14 days</option>
                  </select>
                </div>
                <button
                  onClick={createAuction}
                  className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Create auction
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Auctions ({auctions.length})
              </h2>
              {auctions.length === 0 ? (
                <p className="text-gray-400 text-sm">No auctions yet — create your first one above!</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {auctions.map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            a.type === 'live' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {a.type === 'live' ? '🔴 LIVE' : '⏱ TIMED'}
                          </span>
                          <p className="font-medium text-gray-800">{a.title}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">${a.current_price}</p>
                        <p className="text-xs text-gray-400">
                          Ends {new Date(a.end_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}