"use client"
import { useEffect, useState } from "react"
import Header from "@/components/Header"
import Link from "next/link"

function TimeLeft({ endTime }: { endTime: string }) {
  const end = new Date(endTime)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (diff < 0) return <span className="text-red-500 text-sm">Ended</span>
  if (days > 0) return <span className="text-green-600 text-sm font-medium">⏱ {days}d {hours}h left</span>
  return <span className="text-orange-500 text-sm font-medium">⏱ {hours}h {mins}m left</span>
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([])

  const fetchAuctions = async () => {
    const res = await fetch(`/api/auctions`)
    const data = await res.json()
    setAuctions(data.auctions || [])
  }

  useEffect(() => {
    fetchAuctions()
    const interval = setInterval(fetchAuctions, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Live Auctions</h1>
            <p className="text-gray-500 mt-1">Bid on unique items from our sellers</p>
          </div>
          <div className="flex gap-2">
            <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
              🟢 {auctions.filter((a: any) => a.type === 'live').length} Live
            </span>
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
              ⏱ {auctions.filter((a: any) => a.type === 'timed').length} Timed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {auctions.map((auction: any) => (
            <Link href={auction.type === 'live' ? `/auctions/live/${auction.id}` : `/auctions/${auction.id}`} key={auction.id}>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        auction.type === 'live'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {auction.type === 'live' ? '🔴 LIVE' : '⏱ TIMED'}
                      </span>
                      <TimeLeft endTime={auction.end_time} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">{auction.title}</h2>
                    <p className="text-gray-500 text-sm mt-1">{auction.description}</p>
                    <p className="text-gray-400 text-xs mt-2">by {auction.seller_name}</p>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-xs text-gray-400 mb-1">Current bid</p>
                    <p className="text-3xl font-bold text-indigo-600">${auction.current_price}</p>
                    <button className="mt-3 bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 transition">
                      Place bid →
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}