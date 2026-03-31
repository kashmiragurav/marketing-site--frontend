'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../context/ThemeContext'
import { useDebounce } from '../../hooks/useDebounce'
import Sidebar from './Sidebar'
import CartXLogo from './CartXLogo'

export default function AppShell({ children }) {
  const { user, loading } = useAuth()
  const { count: cartCount, refresh: refreshCart } = useCart()
  const { dark, toggleTheme } = useTheme()
  const router   = useRouter()
  const pathname = usePathname()

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 420)
  const isFirstSearch   = useRef(true)
  const cartLoaded      = useRef(false)

  // Sync search input from URL on route change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSearchInput(params.get('search') || '')
  }, [pathname])

  // Debounced search navigation
  useEffect(() => {
    if (isFirstSearch.current) { isFirstSearch.current = false; return }
    const q = debouncedSearch.trim()
    if (pathname.startsWith('/products') || q) {
      router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
    }
  }, [debouncedSearch]) // eslint-disable-line

  // Load cart count once after user is confirmed — not on every render
  useEffect(() => {
    if (user && !cartLoaded.current) {
      cartLoaded.current = true
      refreshCart()
    }
    if (!user) cartLoaded.current = false
  }, [user, refreshCart])

  // Auth guard — proxy handles server-side redirect, this handles client-side
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading]) // eslint-disable-line

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', marginLeft: 'var(--sidebar-collapsed)' }}>

        {/* ── Topbar ─────────────────────────────────────────── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '0 20px', minHeight: 56,
          background: 'var(--topbar-bg)',
          borderBottom: '1px solid var(--topbar-border)',
        }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', padding: 0, border: 'none', flexShrink: 0, cursor: 'pointer' }}>
            <CartXLogo white size="sm" />
          </button>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSearchInput('')}
              style={{
                width: '100%', padding: '8px 46px 8px 14px',
                background: 'rgba(255,255,255,0.09)',
                border: '1.5px solid rgba(255,255,255,0.14)',
                borderRadius: 10, color: '#f1f5f9', fontSize: '0.9rem', outline: 'none',
              }}
              onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.13)'; e.target.style.borderColor = 'rgba(255,255,255,0.28)' }}
              onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.09)'; e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} style={{
                position: 'absolute', right: 42, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', padding: '0 4px',
              }}>✕</button>
            )}
            <button
              onClick={() => searchInput && router.push(`/products?search=${encodeURIComponent(searchInput.trim())}`)}
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 42,
                background: searchInput ? 'var(--accent)' : 'rgba(255,255,255,0.07)',
                border: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={searchInput ? '#fff' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            <button onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'} style={{
              width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.07)',
              border: 'none', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {dark ? '☀️' : '🌙'}
            </button>

            <button onClick={() => router.push('/cart')} title="Cart" style={{
              position: 'relative', width: 36, height: 36, borderRadius: 8,
              background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              🛒
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3,
                  minWidth: 17, height: 17, borderRadius: 99,
                  background: 'var(--error)', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            <span style={{ fontSize: '0.8rem', color: 'var(--topbar-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </span>

            <button onClick={() => router.push('/profile')} title={user.email} style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {(user.name || user.email)?.[0]?.toUpperCase()}
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '24px 24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
