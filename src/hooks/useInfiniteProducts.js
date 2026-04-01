import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../app/components/api'
import toast from 'react-hot-toast'

const LIMIT = 15

function buildSortParams(sort) {
  switch (sort) {
    case 'price_asc':      return { sortBy: 'price',          order: 'asc'  }
    case 'price_desc':     return { sortBy: 'price',          order: 'desc' }
    case 'title':          return { sortBy: 'title',          order: 'asc'  }
    case 'ratingsAverage': return { sortBy: 'ratingsAverage', order: 'desc' }
    default:               return { sortBy: 'createdAt',      order: 'desc' }
  }
}

export function useInfiniteProducts(filters = {}) {
  const {
    search = '', category = '', sort = 'createdAt',
    inStock = false, minPrice = '', maxPrice = '', minRating = 0,
  } = filters

  const [products, setProducts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(false)

  // All scroll state in refs — never stale inside observer callbacks
  const cursorRef  = useRef(null)   // nextCursor from last response
  const hasMoreRef = useRef(false)  // mirror of hasMore for observer
  const isFetching = useRef(false)  // hard lock — one request at a time
  const genRef     = useRef(0)      // generation counter — incremented on every reset

  const fetchNext = useCallback(async (isReset, gen) => {
    if (isFetching.current) return
    isFetching.current = true

    const { sortBy, order } = buildSortParams(sort)
    const params = {
      limit: LIMIT, sortBy, order,
      ...(!isReset && cursorRef.current ? { cursor: cursorRef.current } : {}),
      ...(search                && { search }),
      ...(category              && { category }),
      ...(inStock               && { inStock: 'true' }),
      ...(minPrice !== ''       && { minPrice: Number(minPrice) }),
      ...(maxPrice !== ''       && { maxPrice: Number(maxPrice) }),
      ...(Number(minRating) > 0 && { minRating: Number(minRating) }),
    }

    if (isReset) setLoading(true)
    else         setLoadingMore(true)

    try {
      const { ok, data } = await api.getProducts(params)

      // Stale response — a newer filter change happened, discard silently
      if (genRef.current !== gen) return

      if (!ok) throw new Error()

      const incoming = data.products   || []
      const more     = data.hasMore    ?? false
      const next     = data.nextCursor ?? null

      if (isReset) {
        // Full replace — no dedup needed, this is a clean slate
        setProducts(incoming)
      } else {
        // Map-based dedup — O(n), guarantees unique _id keys, no duplicate key errors
        setProducts(prev => {
          const map = new Map(prev.map(p => [String(p._id), p]))
          incoming.forEach(p => map.set(String(p._id), p))
          return Array.from(map.values())
        })
      }

      cursorRef.current  = next
      hasMoreRef.current = more
      setHasMore(more)
    } catch {
      if (genRef.current === gen) {
        toast.error('Failed to load products.', { id: 'prod-load' })
      }
    } finally {
      // Always release the lock — even on stale discard
      isFetching.current = false
      if (genRef.current === gen) {
        if (isReset) setLoading(false)
        else         setLoadingMore(false)
      }
    }
  }, [search, category, sort, inStock, minPrice, maxPrice, minRating])

  // Reset on filter change — new generation aborts any in-flight stale fetch
  useEffect(() => {
    const gen = ++genRef.current
    isFetching.current = false   // clear any leftover lock from previous generation
    cursorRef.current  = null
    hasMoreRef.current = false
    setProducts([])
    setHasMore(false)
    fetchNext(true, gen)
  }, [fetchNext])

  // loadMore reads refs — never stale inside observer
  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || isFetching.current) return
    fetchNext(false, genRef.current)
  }, [fetchNext])

  return { products, loading, loadingMore, hasMore, loadMore, setProducts }
}
