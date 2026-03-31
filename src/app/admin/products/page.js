'use client'
// Redirect legacy /admin/products to /inventory
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminProductsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/inventory') }, [router])
  return null
}
