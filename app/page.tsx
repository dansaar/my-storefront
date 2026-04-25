import Link from "next/link"
import Header from "@/components/Header"
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}


      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-800 mb-4">
          Buy and sell anything
        </h2>
        <p className="text-xl text-gray-500 mb-10">
          Discover unique products from sellers around the world
        </p>
        <Link
          href="/products"
          className="bg-indigo-600 text-white text-lg px-8 py-4 rounded-xl hover:bg-indigo-700 transition inline-block"
        >
          Browse Products →
        </Link>
      </div>

    </main>
  )
}