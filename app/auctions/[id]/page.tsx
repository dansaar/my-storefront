"use client"
import { useEffect, useState, Suspense } from "react"
import { getCurrentUser } from "aws-amplify/auth"
import Header from "@/components/Header"
import { useParams, useSearchParams } from "next/navigation"

function AuctionPageContent() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')
  const [auction, setAuction] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null))
    fetchAuction()
    const interval = setInterval(fetchAuction, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchAuction = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auctions/${id}`)
    const data = await res.json()
    setAuction(data.auction)
    setBids(data.bids)
  }

  const handlePayment = async () => {
    if (!user) return
    const res = await fetch("/api/payments/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auctionId: id,
        auctionTitle: auction.title,
        amount: auction.current_price,
        buyerEmail: user.signInDetails?.loginId
      })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const placeBid = async () => {
    if (!user) {
      setMessage("Please sign in to place a bid")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/place-bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId: id,
          amount: parseFloat(amount),
          bidder_id: user.userId
        })
      })
      const data = await res.json()
      if (data.error) {
        setMessage(`❌ ${data.error}`)
      } else {
        setMessage(`✅ Bid of $${amount} placed successfully!`)
        setAmount("")
        fetchAuction()
      }
    } catch (e) {
      setMessage("❌ Something went wrong")
    }
    setLoading(false)
  }

  const timeLeft = () => {
    const diff = new Date(auction?.end_time).getTime() - Date.now()
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
      <div className="max-w-3xl mx-auto px-8 py-20 text-center text-gray-400">Loading auction...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto px-8 py-10">

        <a href="/auctions" className="text-indigo-600 text-sm mb-6 inline-block hover:underline">
          ← Back to auctions
        </a>

        {/* Payment status banners */}
        {paymentStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-700">✅ Payment successful!</h2>
            <p className="text-green-600 mt-1">Your payment has been processed. The seller will be in touch soon.</p>
          </div>
        )}
        {paymentStatus === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-700">❌ Payment cancelled</h2>
            <p className="text-red-600 mt-1">Your payment was cancelled. You can try again below.</p>
          </div>
        )}

        {/* Auction header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              auction.status === 'ended'
                ? 'bg-gray-100 text-gray-500'
                : auction.type === 'live'
                ? 'bg-red-100 text-red-600'
                : 'bg-blue-100 text-blue-600'
            }`}>
              {auction.status === 'ended' ? '🏁 ENDED' : auction.type === 'live' ? '🔴 LIVE' : '⏱ TIMED'}
            </span>
            <span className="text-sm text-orange-500 font-medium">⏱ {timeLeft()}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{auction.title}</h1>
          <p className="text-gray-500 mb-6">{auction.description}</p>
          <p className="text-gray-400 text-sm">Listed by {auction.seller_name}</p>
          <div className="border-t mt-6 pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Starting price</p>
              <p className="text-xl font-semibold text-gray-600">${auction.starting_price}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Current bid</p>
              <p className="text-4xl font-bold text-indigo-600">${auction.current_price}</p>
            </div>
          </div>
        </div>

        {/* Winner payment section */}
        {auction.status === 'ended' && user && auction.winner_id === user.userId && paymentStatus !== 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">🏆 You won this auction!</h2>
            <p className="text-gray-500 mb-4">Congratulations! Complete your purchase to claim your item.</p>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold text-green-600">${auction.current_price}</span>
              <button
                onClick={handlePayment}
                className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition font-medium text-lg"
              >
                Pay now →
              </button>
            </div>
          </div>
        )}

        {/* Ended — show winner */}
        {auction.status === 'ended' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">🏁 Auction ended</h2>
            {auction.winner_name ? (
              <p className="text-gray-500">Won by <span className="font-medium text-indigo-600">{auction.winner_name}</span> for <span className="font-bold">${auction.current_price}</span></p>
            ) : (
              <p className="text-gray-500">No bids were placed on this auction.</p>
            )}
          </div>
        )}

        {/* Place bid — only show if active */}
        {auction.status !== 'ended' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Place a bid</h2>
            {message && (
              <p className={`text-sm mb-4 ${message.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
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
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
              >
                {loading ? "Placing..." : "Place bid"}
              </button>
            </div>
            {!user && (
              <p className="text-sm text-gray-400 mt-3">
                <a href="/signin" className="text-indigo-600">Sign in</a> to place a bid
              </p>
            )}
          </div>
        )}

        {/* Bid history */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Bid history ({bids.length})
          </h2>
          {bids.length === 0 ? (
            <p className="text-gray-400 text-sm">No bids yet — be the first!</p>
          ) : (
            <div className="flex flex-col gap-3">
              {bids.map((bid: any, i: number) => (
                <div key={bid.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-yellow-500">🏆</span>}
                    <span className="text-sm text-gray-600">{bid.bidder_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-800">${bid.amount}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(bid.created_at).toLocaleDateString()}
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

export default function AuctionPage() {
  return (
    <Suspense>
      <AuctionPageContent />
    </Suspense>
  )
}