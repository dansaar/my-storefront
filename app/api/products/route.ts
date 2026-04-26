import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/db`)
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  return NextResponse.json(data)
}