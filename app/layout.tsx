import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import AmplifyProvider from "@/components/AmplifyProvider"

export const metadata: Metadata = {
  title: "My Marketplace",
  description: "Buy and sell anything",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  )
}