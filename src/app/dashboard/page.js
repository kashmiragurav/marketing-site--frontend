'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import AppShell from '../components/AppShell'
import { api } from '../components/api'

const T = {
  card:    'var(--surface)',
  border:  'var(--border)',
  bg:      'var(--bg)',
  text:    'var(--text-primary)',
  muted:   'var(--text-muted)',
  accent:  'var(--accent)',
  success: 'var(--success)',
  error:   'var(--error)',
  warning: 'var(--warning)',
}

function StatCard({ label, value, icon, valueColor, loading }) {
  if (loading) return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
      <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 28, width: 60, marginBottom: 8 }} />
    </div>
  )
  return (
    <div className="fade-in" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.muted, margin: 0 }}>{label}</p>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      </div>
      <p style={{ fontSize: '1.875rem', fontWeight: 800, color: valueColor || T.text, margin: 0 }}>{value}</p>
    </div>
  )
}

function ProductRow({ product, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.background = T.bg }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
      <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: T.bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product.image
          ? <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <span style={{ fontSize: '1.1rem' }}>📦</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</p>
        <p style={{ fontSize: '0.7rem', color: T.muted, margin: '2px 0 0' }}>{product.category || 'General'}</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: T.text, margin: 0 }}>₹{Number(product.price).toLocaleString('en-IN')}</p>
        <p style={{ fontSize: '0.7rem', margin: '2px 0 0', color: product.stock > 0 ? T.success : T.error }}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats]       = useState(null)
  const [topRated, setTopRated] = useState([])
  const [recent, setRecent]     = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Try the aggregated endpoint first; fall back to parallel calls if not available
      const statsRes = await api.getDashboardStats()
      if (statsRes.ok && statsRes.data.total !== undefined) {
        const d = statsRes.data
        setStats({ total: d.total, inStock: d.inStock, outOfStock: d.outOfStock, topRated: d.topRated, stockRate: d.stockRate })
        setTopRated(d.topRatedProducts  || [])
        setRecent(d.recentProducts      || [])
        setLowStock(d.lowStockProducts  || [])
      } else {
        // Fallback: parallel product queries
        const [allRes, stockRes, topRes, recentRes, lowRes] = await Promise.all([
          api.getProducts({ limit: 1 }),
          api.getProducts({ inStock: 'true', limit: 1 }),
          api.getProducts({ sortBy: 'ratingsAverage', order: 'desc', limit: 5 }),
          api.getProducts({ sortBy: 'createdAt', order: 'desc', limit: 5 }),
          api.getProducts({ sortBy: 'stock', order: 'asc', limit: 5, inStock: 'true' }),
        ])
        const total   = allRes.data.total   || 0
        const inStock = stockRes.data.total || 0
        setStats({ total, inStock, outOfStock: total - inStock, topRated: (topRes.data.products || []).filter(p => p.ratingsAverage >= 4).length, stockRate: total > 0 ? Math.round((inStock / total) * 100) : 0 })
        setTopRated(topRes.data.products  || [])
        setRecent(recentRes.data.products || [])
        setLowStock(lowRes.data.products  || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  // Fetch on mount
  useEffect(() => { load() }, [load])

  // Re-fetch when tab becomes visible (user navigates back)
  useEffect(() => {
    function onVisible() { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const cards = [
    { label: 'Total Products', value: stats?.total      ?? '—', icon: '📦', valueColor: T.text },
    { label: 'In Stock',       value: stats?.inStock    ?? '—', icon: '✅', valueColor: T.success },
    { label: 'Out of Stock',   value: stats?.outOfStock ?? '—', icon: '⚠️', valueColor: T.error },
    { label: 'Top Rated ≥4★',  value: stats?.topRated   ?? '—', icon: '⭐', valueColor: T.warning },
  ]

  const listSections = [
    { title: '⭐ Top Rated',      items: topRated, href: '/products?sortBy=ratingsAverage&order=desc' },
    { title: '🆕 Recently Added', items: recent,   href: '/products?sortBy=createdAt&order=desc' },
    { title: '⚠️ Low Stock',      items: lowStock, href: '/inventory' },
  ]

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Welcome */}
        <div className="fade-in" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: '0.9375rem', color: T.muted, margin: 0 }}>
            Welcome back, <span style={{ fontWeight: 700, color: T.text }}>{user?.name || user?.email}</span>
          </p>
        </div>

        {/* Overview heading */}
        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, marginBottom: 10 }}>Overview</p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {cards.map(c => <StatCard key={c.label} {...c} loading={loading} />)}
        </div>

        {/* Inventory health bar */}
        {!loading && stats && (
          <div className="fade-in" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text, margin: 0 }}>Inventory Health</p>
              <button onClick={() => router.push('/inventory')} style={{ fontSize: '0.8rem', fontWeight: 500, color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                Manage Products →
              </button>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${stats.stockRate}%`, background: stats.stockRate > 60 ? T.success : stats.stockRate > 30 ? T.warning : T.error, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: T.muted }}>
              <span>{stats.inStock} in stock</span>
              <span>{stats.stockRate}% available</span>
              <span>{stats.outOfStock} out of stock</span>
            </div>
          </div>
        )}

        {/* Three-column lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {listSections.map(({ title, items, href }) => (
            <div key={title} className="fade-in" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text, margin: 0 }}>{title}</p>
                <button onClick={() => router.push(href)} style={{ fontSize: '0.8rem', fontWeight: 500, color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                  View all →
                </button>
              </div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 11, width: '70%', marginBottom: 6 }} />
                        <div className="skeleton" style={{ height: 9, width: '45%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p style={{ fontSize: '0.8rem', textAlign: 'center', padding: '24px 0', color: T.muted }}>No products yet</p>
              ) : (
                <div>
                  {items.map(p => (
                    <ProductRow key={p._id} product={p} onClick={() => router.push(`/products/${p._id}`)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
