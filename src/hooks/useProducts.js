import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../app/components/api'
import toast from 'react-hot-toast'

function resolveSortParams(sort) {
  switch (sort) {
    case 'price_asc':      return { sortBy: 'price',          order: 'asc'  }
    case 'price_desc':     return { sortBy: 'price',          order: 'desc' }
    case 'title':          return { sortBy: 'title',          order: 'asc'  }
    case 'ratingsAverage': return { sortBy: 'ratingsAverage', order: 'desc' }
    default:               return { sortBy: 'createdAt',      order: 'desc' }
  }
}

export function useProducts(filters = {}) {
  const { search, category, sort, inStock, minPrice, maxPrice, minRating } = filters

  const [products, setProducts]       = useState([])
  const [total, setTotal]             = useState(0)
  const [hasMore, setHasMore]         = useState(false)
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Cursor: only lastId needed — backend resolves sort value from DB
  const lastIdRef  = useRef(null)
  const seenIds    = useRef(new Set())
  const isFetching = useRef(false)

  const fetchNext = useCallback(async (replace = false) => {
    if (isFetching.current) return
    isFetching.current = true

    const { sortBy, order } = resolveSortParams(sort)

    const params = {
      limit: 24,
      sortBy,
      order,
      ...(search                && { search }),
      ...(category              && { category }),
      ...(inStock               && { inStock: 'true' }),
      ...(minPrice !== ''       && { minPrice: Number(minPrice) }),
      ...(maxPrice !== ''       && { maxPrice: Number(maxPrice) }),
      ...(Number(minRating) > 0 && { minRating: Number(minRating) }),
      // Only send cursor on subsequent fetches
      ...(!replace && lastIdRef.current ? { lastId: lastIdRef.current } : {}),
    }

    if (replace) setLoading(true)
    else setLoadingMore(true)

    try {
      const { ok, data } = await api.getProducts(params)
      if (!ok) throw new Error('fetch failed')

      const incoming = data.products || []

      if (replace) {
        seenIds.current = new Set(incoming.map(p => String(p._id)))
        setProducts(incoming)
      } else {
        const fresh = incoming.filter(p => !seenIds.current.has(String(p._id)))
        fresh.forEach(p => seenIds.current.add(String(p._id)))
        if (fresh.length > 0) setProducts(prev => [...prev, ...fresh])
      }

      setTotal(data.total || 0)
      setHasMore(!!data.hasMore)
      lastIdRef.current = data.nextLastId ?? null
    } catch {
      toast.error('Failed to load products.', { id: 'prod-load' })
    } finally {
      isFetching.current = false
      setLoading(false)
      setLoadingMore(false)
    }
  }, [search, category, sort, inStock, minPrice, maxPrice, minRating])

  // Reset cursor and fetch first batch whenever filters change
  useEffect(() => {
    isFetching.current = false
    lastIdRef.current  = null
    seenIds.current    = new Set()
    fetchNext(true)
  }, [fetchNext])

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading && !isFetching.current) {
      fetchNext(false)
    }
  }, [hasMore, loadingMore, loading, fetchNext])

  return { products, total, loading, loadingMore, hasMore, loadMore, setProducts }
}
