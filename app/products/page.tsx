import Header from "@/components/Header"

async function getProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/db`, {
    next: { revalidate: 30 }
  })
  const data = await res.json()
  return data.products || []
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-8 py-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Products</h2>
        <p className="text-gray-500 mb-8">Discover unique items from our sellers</p>

        {products.length === 0 ? (
          <p className="text-gray-400">No products yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {products.map((p: any) => (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="bg-indigo-50 rounded-xl h-32 mb-4 flex items-center justify-center text-4xl">
                  🛒
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">{p.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{p.seller_name}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-bold text-indigo-600">${p.price}</span>
                  <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                    Buy now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}