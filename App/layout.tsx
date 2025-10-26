
export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Goal Prediction System - Real-Time Football Analytics",
  description: "Advanced AI-powered goal prediction system for live football matches with real-time statistics and machine learning",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Goal Prediction System",
    description: "Real-time football prediction dashboard with live match statistics and AI analysis",
    images: ["/og-image.png"],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
