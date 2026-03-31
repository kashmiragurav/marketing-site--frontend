'use client'

import { useEffect, useRef, useState } from 'react'
import ProductCard from './ProductCard'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ProductList() {
  const [products, setProducts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(false)
  const [error, setError]             = useState('')

  const lastIdRef  = useRef(null)
  const seenIds    = useRef(new Set())
  const isFetching = useRef(false)
  const sentinelRef = useRef(null)
  const observerRef = useRef(null)

  async function fetchPage(replace = false) {
    if (isFetching.current) return
    isFetching.current = true

    const params = new URLSearchParams({ limit: 24 })
    if (!replace && lastIdRef.current) params.set('lastId', lastIdRef.current)

    if (replace) setLoading(true)
    else setLoadingMore(true)

    try {
      const res = await fetch(`${BASE_URL}/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()

      const incoming = data.products || []

      if (replace) {
        seenIds.current = new Set(incoming.map(p => String(p._id)))
        setProducts(incoming)
      } else {
        const fresh = incoming.filter(p => !seenIds.current.has(String(p._id)))
        fresh.forEach(p => seenIds.current.add(String(p._id)))
        if (fresh.length) setProducts(prev => [...prev, ...fresh])
      }

      setHasMore(!!data.hasMore)
      lastIdRef.current = data.nextLastId ?? null
    } catch (err) {
      console.error('ProductList fetch error:', err)
      setError('Failed to load products. Is the backend running?')
    } finally {
      isFetching.current = false
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial load
  useEffect(() => { fetchPage(true) }, [])

  // Re-attach observer after loading so sentinel is in DOM
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!sentinelRef.current) return
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isFetching.current) fetchPage(false)
    }, { rootMargin: '200px', threshold: 0 })
    observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [loading])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) return <p className="text-error text-sm text-center py-10">{error}</p>

  if (products.length === 0) return <p className="text-text-muted text-sm text-center py-10">No products found.</p>

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-6">
        {loadingMore && (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        {!hasMore && products.length > 0 && (
          <p className="text-text-muted text-sm">All products loaded</p>
        )}
      </div>
    </>
  )
}
