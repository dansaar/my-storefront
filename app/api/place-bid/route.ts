import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { auctionId, amount, bidder_id } = await req.json()

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auctions/${auctionId}/bids`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, bidder_id })
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}