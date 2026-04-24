import { getProducts } from "@/lib/api"

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      <div className="grid grid-cols-3 gap-6">
        {products.map((p: any) => (
          <div
            key={p.id}
            className="border rounded-xl p-4 shadow-sm hover:shadow-md transition"
          >
            <h2 className="font-semibold text-lg">{p.name}</h2>
            <p className="text-gray-500 text-sm">{p.seller}</p>
            <p className="text-xl font-bold mt-2">${p.price}</p>
          </div>
        ))}
      </div>
    </main>
  )
}