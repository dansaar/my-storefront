import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { id, email, name } = await req.json()

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, email, name })
  })

  const data = await res.json()
  return NextResponse.json(data)
}