import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * useFilters — manages product filter state, reading initial values from URL.
 */
export function useFilters() {
  const searchParams = useSearchParams()

  const [category,  setCategory]  = useState(searchParams.get('category') || '')
  const [sort,      setSort]      = useState(searchParams.get('sortBy')   || 'createdAt')
  const [inStock,   setInStock]   = useState(false)
  const [minPrice,  setMinPrice]  = useState('')
  const [maxPrice,  setMaxPrice]  = useState('')
  const [minRating, setMinRating] = useState(0)

  function clearFilters() {
    setCategory('')
    setSort('createdAt')
    setInStock(false)
    setMinPrice('')
    setMaxPrice('')
    setMinRating(0)
  }

  const hasFilters = !!(category || inStock || minPrice || maxPrice || minRating > 0)

  return {
    category, setCategory,
    sort,     setSort,
    inStock,  setInStock,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    minRating, setMinRating,
    clearFilters,
    hasFilters,
  }
}
