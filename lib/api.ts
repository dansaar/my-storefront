const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function getProducts() {
  const res = await fetch(`${API_URL}/products`, {
    next: { revalidate: 60 }
  })

  if (!res.ok) {
    throw new Error("Failed to fetch products")
  }

  const data = await res.json()
  return data.products
}