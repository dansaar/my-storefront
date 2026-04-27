import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { auctionId, auctionTitle, amount, buyerEmail } = await req.json()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Auction Win: ${auctionTitle}`,
            description: `You won this auction with a bid of $${amount}`
          },
          unit_amount: Math.round(amount * 100)
        },
        quantity: 1
      }
    ],
    mode: "payment",
    customer_email: buyerEmail,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auctions/${auctionId}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auctions/${auctionId}?payment=cancelled`,
    metadata: {
      auctionId,
      buyerEmail
    }
  })

  return NextResponse.json({ url: session.url })
}