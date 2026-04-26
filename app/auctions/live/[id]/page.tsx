"use client"
import { useEffect, useState, useRef } from "react"
import { getCurrentUser } from "aws-amplify/auth"
import Header from "@/components/Header"
import { useParams } from "next/navigation"

export default function LiveAuctionPage() {
  console.log('LiveAuctionPage rendering')
  const { id } = useParams()
  const [auction, setAuction] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [connected, setConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    console.log('useEffect fired, id:', id)
    if (!id) return
    getCurrentUser().then(setUser).catch(() => setUser(null))
    fetchAuction()
    const timer = setTimeout(() => connectWebSocket(), 100)
    const interval = setInterval(fetchAuction, 10000)
    return () => {
      clearTimeout(timer)
      ws.current?.close()
      ws.current = null
      clearInterval(interval)
    }
  }, [id])

  const fetchAuction = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auctions/${id}`)
    const data = await res.json()
    setAuction(data.auction)
    setBids(data.bids || [])
  }

  const connectWebSocket = () => {
    console.log('connectWebSocket called, ws state:', ws.current?.readyState)
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      console.log('Already connected, skipping')
      return
    }
    console.log('Connecting WebSocket with:', {
      wsUrl: process.env.NEXT_PUBLIC_WS_URL,
      auctionId: id
    })
    const socket = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}?auctionId=${id}`
    )
    socket.onopen = () => {
      console.log('WebSocket connected!')
      setConnected(true)
    }
    socket.onclose = () => {
      console.log('WebSocket disconnected!')
      setConnected(false)
    }
    socket.onerror = (err) => {
      console.log('WebSocket error:', err)
    }
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'newBid') {
        setBids(prev => [{
          id: Date.now().toString(),
          amount: data.amount,
          bidder_name: data.bidderName,
          created_at: data.timestamp
        }, ...prev])
        setAuction((prev: any) => prev ? { ...prev, current_price: data.amount } : prev)
        setMessage(`✅ New bid: $${data.amount} by ${data.bidderName}`)
      }
      if (data.type === 'error') {
        setMessage(`❌ ${data.message}`)
      }
    }
    ws.current = socket
  }

  const placeBid = () => {
    if (!user) {
      setMessage("Please sign in to place a bid")
      return
    }
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setMessage("❌ Not connected — please refresh")
      return
    }
    ws.current.send(JSON.stringify({
      action: "sendBid",
      auctionId: id,
      amount: parseFloat(amount),
      bidderId: user.userId,
      bidderName: user.signInDetails?.loginId?.split("@")[0] || "Bidder"
    }))
    setMessage("⏳ Placing bid...")
    setAmount("")
    setTimeout(() => {
      setMessage(prev => prev === "⏳ Placing bid..." ? "" : prev)
    }, 3000)
  }

  const timeLeft = () => {
    if (!auction) return ""
    const diff = new Date(auction.end_time).getTime() - Date.now()
    if (diff < 0) return "Auction ended"
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) return `${days}d ${hours}h ${mins}m left`
    return `${hours}h ${mins}m left`
  }

  if (!auction) return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto px-8 py-20 text-center text-gray-400">
        Loading auction...
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto px-8 py-10">
        <a href="/auctions" className="text-indigo-600 text-sm mb-6 inline-block hover:underline">
          ← Back to auctions
        </a>
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
            🔴 LIVE
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            connected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {connected ? '● Connected' : '○ Connecting...'}
          </span>
          <span className="text-sm text-orange-500 font-medium">⏱ {timeLeft()}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{auction.title}</h1>
          <p className="text-gray-500 mb-6">{auction.description}</p>
          <p className="text-gray-400 text-sm mb-6">Listed by {auction.seller_name}</p>
          <div className="flex justify-between items-center border-t pt-6">
            <div>
              <p className="text-sm text-gray-400">Starting price</p>
              <p className="text-xl font-semibold text-gray-600">${auction.starting_price}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Current bid</p>
              <p className="text-5xl font-bold text-indigo-600">${auction.current_price}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Place a bid</h2>
          {message && (
            <p className={`text-sm mb-4 ${
              message.includes('✅') ? 'text-green-600' :
              message.includes('⏳') ? 'text-blue-500' : 'text-red-500'
            }`}>
              {message}
            </p>
          )}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-gray-400">$</span>
              <input
                className="w-full border rounded-lg pl-7 pr-4 py-2 text-sm"
                placeholder={`More than $${auction.current_price}`}
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <button
              onClick={placeBid}
              disabled={!connected}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
            >
              Bid live
            </button>
          </div>
          {!user && (
            <p className="text-sm text-gray-400 mt-3">
              <a href="/signin" className="text-indigo-600">Sign in</a> to place a bid
            </p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Live bid feed ({bids.length})
          </h2>
          {bids.length === 0 ? (
            <p className="text-gray-400 text-sm">No bids yet — be the first!</p>
          ) : (
            <div className="flex flex-col gap-3">
              {bids.map((bid: any, i: number) => (
                <div
                  key={bid.id}
                  className={`flex justify-between items-center py-2 border-b last:border-0 ${
                    i === 0 ? 'bg-yellow-50 -mx-2 px-2 rounded-lg' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-yellow-500">🏆</span>}
                    <span className="text-sm text-gray-600">{bid.bidder_name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold ${i === 0 ? 'text-indigo-600 text-lg' : 'text-gray-800'}`}>
                      ${bid.amount}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(bid.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}