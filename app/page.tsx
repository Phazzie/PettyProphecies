"use client"

import { HomePage } from "@/components/HomePage"

// Disable static generation for this page since it uses client-side auth
export const dynamic = 'force-dynamic'

export default function Home() {
  return <HomePage />
}

