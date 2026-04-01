'use client'

import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useInfiniteProducts } from '../../hooks/useInfiniteProducts'
import AppShell from '../components/AppShell'
import { api } from '../components/api'
import toast from 'react-hot-toast'

import { CATEGORIES, SORT_OPTIONS, PRICE_RANGES } from '../../lib/constants'

/* ── Tokens (works in both themes via compat aliases) */
const T = {
  card:      'var(--surface)',
  border:    'var(--border)',
  bg:        'var(--bg)',
  text:      'var(--text-primary)',
  muted:     'var(--text-muted)',
  accent:    'var(--accent)',
  accentBg:  'var(--accent-light)',
  success:   'var(--success)',
  error:     'var(--error)',
  inputBg:   'var(--input-bg)',
  inputText: 'var(--input-text)',
}

function SkeletonCard() {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 150 }} />
      <div style={{ padding: 12 }}>
        <div className="skeleton" style={{ height: 11, width: '75%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 10, width: '50%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 32, borderRadius: 8 }} />
      </div>
    </div>
  )
}

/* ── Individual filter section with its own Clear button */
function FilterSection({ title, hasValue, onClear, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 12, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.muted }}>
          {title}
        </span>
        {hasValue && (
          <button onClick={onClear} style={{ fontSize: '0.68rem', color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
            Clear
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', padding: '6px 10px', borderRadius: 6,
        fontSize: '0.8rem', border: 'none', cursor: 'pointer', width: '100%',
        background: active ? T.accentBg : 'transparent',
        color: active ? T.accent : T.muted,
        fontWeight: active ? 600 : 400,
        transition: 'background 0.12s, color 0.12s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.bg; e.currentTarget.style.color = T.text } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.muted } }}
    >
      {children}
    </button>
  )
}

/* ── Left filter sidebar — Amazon-style */
function FilterSidebar({ category, setCategory, inStock, setInStock, minPrice, setMinPrice, maxPrice, setMaxPrice, minRating, setMinRating, hasFilters, onClearAll }) {
  const selectedRange = PRICE_RANGES.find(r => r.min === minPrice && r.max === maxPrice) || null

  function togglePriceRange(r) {
    if (selectedRange?.label === r.label) { setMinPrice(''); setMaxPrice('') }
    else { setMinPrice(r.min); setMaxPrice(r.max) }
  }

  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: '16px 14px',
      position: 'sticky', top: 78,
      maxHeight: 'calc(100vh - 98px)', overflowY: 'auto',
    }}>
      {/* Header with Clear All */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text, margin: 0 }}>Filters</p>
        {hasFilters && (
          <button onClick={onClearAll} style={{
            fontSize: '0.72rem', fontWeight: 600, color: T.accent,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <FilterSection title="Category" hasValue={!!category} onClear={() => setCategory('')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FilterBtn active={!category} onClick={() => setCategory('')}>All Categories</FilterBtn>
          {CATEGORIES.map(c => (
            <FilterBtn key={c} active={category === c} onClick={() => setCategory(category === c ? '' : c)}>
              {c}
            </FilterBtn>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" hasValue={inStock} onClear={() => setInStock(false)}>
        <label htmlFor="filter-instock" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: T.text, padding: '4px 0' }}>
          <input id="filter-instock" name="inStock" type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} style={{ width: 'auto', accentColor: T.accent }} />
          In Stock Only
        </label>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price Range" hasValue={!!(minPrice || maxPrice)} onClear={() => { setMinPrice(''); setMaxPrice('') }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 8 }}>
          {PRICE_RANGES.map(r => (
            <FilterBtn key={r.label} active={selectedRange?.label === r.label} onClick={() => togglePriceRange(r)}>
              {r.label}
            </FilterBtn>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            id="filter-min-price" name="minPrice"
            type="number" placeholder="Min ₹" value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            style={{ fontSize: '0.75rem', padding: '5px 8px', background: T.inputBg, color: T.inputText, border: `1px solid ${T.border}`, borderRadius: 6, width: '100%', outline: 'none' }} />
          <input
            id="filter-max-price" name="maxPrice"
            type="number" placeholder="Max ₹" value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            style={{ fontSize: '0.75rem', padding: '5px 8px', background: T.inputBg, color: T.inputText, border: `1px solid ${T.border}`, borderRadius: 6, width: '100%', outline: 'none' }} />
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Customer Rating" hasValue={minRating > 0} onClear={() => setMinRating(0)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[4, 3, 2, 1].map(r => (
            <FilterBtn key={r} active={minRating === r} onClick={() => setMinRating(minRating === r ? 0 : r)}>
              <span style={{ color: '#f59e0b' }}>{'★'.repeat(r)}</span>
              <span style={{ color: T.border }}>{'★'.repeat(5 - r)}</span>
              <span style={{ marginLeft: 4, fontSize: '0.72rem', color: T.muted }}> & up</span>
            </FilterBtn>
          ))}
        </div>
      </FilterSection>
    </aside>
  )
}

/* ── Sort bar — separate from filters */
function SortBar({ sort, setSort, total, loading, urlSearch, category }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '10px 16px', marginBottom: 16,
    }}>
      <div>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text }}>
          {urlSearch ? `"${urlSearch}"` : category || 'All Products'}
        </span>
        <span style={{ fontSize: '0.8rem', color: T.muted, marginLeft: 8 }}>
          {loading ? '…' : `${total} result${total !== 1 ? 's' : ''}`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: T.muted, whiteSpace: 'nowrap' }}>Sort by:</span>
        {SORT_OPTIONS.map(o => (
          <button key={o.value} onClick={() => setSort(o.value)} style={{
            padding: '5px 10px', borderRadius: 6, fontSize: '0.75rem',
            fontWeight: sort === o.value ? 600 : 400,
            background: sort === o.value ? T.accent : T.bg,
            color: sort === o.value ? '#fff' : T.muted,
            border: `1px solid ${sort === o.value ? T.accent : T.border}`,
            cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { if (sort !== o.value) { e.currentTarget.style.background = T.border; e.currentTarget.style.color = T.text } }}
            onMouseLeave={e => { if (sort !== o.value) { e.currentTarget.style.background = T.bg; e.currentTarget.style.color = T.muted } }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main products content */
function ProductsContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user }     = useAuth()
  const { refresh: refreshCart } = useCart()

  // All filter state is derived from URL — survives reload
  const urlSearch  = searchParams.get('search')   || ''
  const category   = searchParams.get('category') || ''
  const sort       = searchParams.get('sort')      || 'createdAt'
  const inStock    = searchParams.get('inStock')   === 'true'
  const minPrice   = searchParams.get('minPrice')  || ''
  const maxPrice   = searchParams.get('maxPrice')  || ''
  const minRating  = Number(searchParams.get('minRating') || 0)

  const hasFilters = !!(category || inStock || minPrice || maxPrice || minRating > 0)

  // Update a single filter param in the URL without losing others
  function setParam(key, value) {
    const p = new URLSearchParams(searchParams.toString())
    if (!value || value === '0' || value === 'false' || value === 'createdAt') {
      p.delete(key)
    } else {
      p.set(key, String(value))
    }
    // Reset to page 1 on filter change
    p.delete('page')
    router.replace(`/products?${p.toString()}`, { scroll: false })
  }

  function setCategory(v)  { setParam('category', v) }
  function setSort(v)      { setParam('sort', v) }
  function setInStock(v)   { setParam('inStock', v ? 'true' : '') }
  function setMinPrice(v)  { setParam('minPrice', v) }
  function setMaxPrice(v)  { setParam('maxPrice', v) }
  function setMinRating(v) { setParam('minRating', v > 0 ? String(v) : '') }

  function clearAllFilters() {
    const p = new URLSearchParams()
    if (urlSearch) p.set('search', urlSearch)
    router.replace(`/products?${p.toString()}`, { scroll: false })
  }

  const { products, loading, loadingMore, hasMore, loadMore, setProducts } =
    useInfiniteProducts({ search: urlSearch, category, sort, inStock, minPrice, maxPrice, minRating })

  const [adding, setAdding]                 = useState(null)
  const [hoveredStar, setHoveredStar]       = useState({})
  const [submittingRate, setSubmittingRate] = useState(null)

  // ── Infinite scroll ──────────────────────────────────────────────────────────────
  const loadMoreRef = useRef(loadMore)
  useEffect(() => { loadMoreRef.current = loadMore }, [loadMore])

  const observerRef = useRef(null)
  const sentinelRef = useCallback(node => {
    if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null }
    if (!node) return
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current() },
      { rootMargin: '400px', threshold: 0 }
    )
    observerRef.current.observe(node)
  }, [])

  async function handleAddToCart(productId) {
    if (!user) { router.push('/login'); return }
    setAdding(productId)
    const { ok, data } = await api.addToCart({ productId, quantity: 1 })
    if (ok) { toast.success('Added to cart!', { id: `cart-${productId}` }); refreshCart() }
    else toast.error(data.message || 'Failed to add', { id: `cart-err-${productId}` })
    setAdding(null)
  }

  async function handleRate(productId, star) {
    if (!user) { router.push('/login'); return }
    setSubmittingRate(productId)
    const { ok, data } = await api.rateProduct(productId, star)
    if (ok) {
      toast.success(`Rated ${star}★`, { id: `rate-${productId}` })
      setProducts(prev => prev.map(p =>
        String(p._id) === productId
          ? { ...p, ratingsAverage: data.ratingsAverage, ratingsCount: data.ratingsCount }
          : p
      ))
    } else {
      toast.error(data.message || 'Rating failed', { id: `rate-err-${productId}` })
    }
    setSubmittingRate(null)
  }

  const pageBody = (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <FilterSidebar
        category={category} setCategory={setCategory}
        inStock={inStock} setInStock={setInStock}
        minPrice={minPrice} setMinPrice={setMinPrice}
        maxPrice={maxPrice} setMaxPrice={setMaxPrice}
        minRating={minRating} setMinRating={setMinRating}
        hasFilters={hasFilters} onClearAll={clearAllFilters}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <SortBar sort={sort} setSort={setSort} total={products.length} loading={loading} urlSearch={urlSearch} category={category} />

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: T.text }}>No products found</p>
            <p style={{ fontSize: '0.8rem', color: T.muted, marginTop: 4 }}>Try adjusting your filters</p>
            {hasFilters && (
              <button onClick={clearAllFilters} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, background: T.accent, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => {
              const id  = String(product._id)
              const avg = product.ratingsAverage ?? 0
              const cnt = product.ratingsCount   ?? 0
              return (
                <div key={id} className="fade-in" style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  transition: 'box-shadow 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ height: 155, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, background: T.bg, cursor: 'pointer' }}
                    onClick={() => router.push(`/products/${id}`)}>
                    {product.image
                      ? <img src={product.image} alt={product.title} style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '2.5rem' }}>📦</span>}
                  </div>

                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.text, marginBottom: 4, cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      onClick={() => router.push(`/products/${id}`)}>
                      {product.title}
                    </p>

                    <p style={{ fontSize: '0.7rem', color: T.muted, marginBottom: 4 }}>
                      {product.category || 'General'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 6 }}>
                      {[1,2,3,4,5].map(star => (
                        <button key={star} disabled={submittingRate === id}
                          onClick={() => handleRate(id, star)}
                          onMouseEnter={() => setHoveredStar(p => ({ ...p, [id]: star }))}
                          onMouseLeave={() => setHoveredStar(p => ({ ...p, [id]: 0 }))}
                          style={{ background: 'none', padding: 0, fontSize: '0.85rem', lineHeight: 1, cursor: 'pointer', border: 'none' }}>
                          <span style={{ color: (hoveredStar[id] >= star || (!hoveredStar[id] && Math.round(avg) >= star)) ? '#f59e0b' : T.border }}>★</span>
                        </button>
                      ))}
                      <span style={{ fontSize: '0.68rem', color: T.muted, marginLeft: 2 }}>
                        {cnt > 0 ? `${avg.toFixed(1)} (${cnt})` : 'No ratings'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: 8, color: product.stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                      {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </p>

                    <p style={{ fontSize: '1rem', fontWeight: 700, color: T.text, marginTop: 'auto', marginBottom: 8 }}>
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </p>

                    <button onClick={() => handleAddToCart(id)}
                      disabled={adding === id || product.stock <= 0}
                      style={{
                        width: '100%', padding: '8px 0', borderRadius: 8,
                        fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                        background: adding === id || product.stock <= 0 ? T.border : T.accent,
                        color: adding === id || product.stock <= 0 ? T.muted : '#fff',
                        transition: 'background 0.15s',
                      }}>
                      {adding === id ? 'Adding…' : product.stock <= 0 ? 'Out of Stock' : user ? 'Add to Cart' : 'Sign in to Buy'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sentinel — always in DOM, never inside any conditional */}
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

        <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          {loadingMore && <div style={{ width: 22, height: 22, border: `2px solid ${T.accent}`, borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />}
          {!loading && !loadingMore && !hasMore && products.length > 0 && <p style={{ fontSize: '0.8rem', color: T.muted }}>All products loaded</p>}
        </div>
      </div>
    </div>
  )

  if (user) return <AppShell>{pageBody}</AppShell>

  // Public layout — no login required
  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', minHeight: 54, background: 'var(--topbar-bg)', borderBottom: '1px solid var(--topbar-border)' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#e2e8f0' }}>Cart<span style={{ color: 'var(--accent)' }}>X</span></span>
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push('/login')} style={{ padding: '7px 16px', fontSize: '0.875rem', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', fontWeight: 500 }}>Sign In</button>
        <button onClick={() => router.push('/signup')} style={{ padding: '7px 16px', fontSize: '0.875rem', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Sign Up</button>
      </header>
      <div style={{ padding: 20 }}>{pageBody}</div>
    </div>
  )
}

export default function ProductsPage() {
  return <Suspense><ProductsContent /></Suspense>
}
