import { NextRequest, NextResponse } from "next/server"

export async function PUT(req: NextRequest) {
  const { userId, role } = await req.json()
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role })
  })
  const data = await res.json()
  return NextResponse.json(data)
}