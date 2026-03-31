'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { api } from './components/api'
import CartXLogo from './components/CartXLogo'
import { CATEGORIES } from '../lib/constants'

const FEATURES = [
  { icon: '📦', title: 'Inventory Management', desc: 'Track stock levels, manage SKUs, and get low-stock alerts in real time.' },
  { icon: '📊', title: 'Analytics & Reports',  desc: 'Category insights, price distribution, and rating trends at a glance.' },
  { icon: '🛒', title: 'Cart & Orders',        desc: 'Seamless cart experience with order tracking and status updates.' },
  { icon: '🔐', title: 'Secure & Scalable',    desc: 'Role-based access, soft deletes, and production-grade architecture.' },
]

export default function HomePage() {
  const { user }              = useAuth()
  const { dark, toggleTheme } = useTheme()
  const router                = useRouter()
  const [featured, setFeatured] = useState([])
  const [search, setSearch]     = useState('')

  useEffect(() => {
    api.getProducts({ limit: 8, sortBy: 'ratingsAverage', order: 'desc' })
      .then(({ data }) => setFeatured(data.products || []))
      .catch(() => {})
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    const q = search.trim()
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--topbar-border)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <CartXLogo white />
          </button>

          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 46px 8px 14px',
                background: 'rgba(255,255,255,0.09)',
                border: '1.5px solid rgba(255,255,255,0.14)',
                borderRadius: 10, color: 'var(--topbar-text)', fontSize: '0.9rem', outline: 'none',
              }}
              onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.13)'; e.target.style.borderColor = 'rgba(255,255,255,0.28)' }}
              onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.09)'; e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
            />
            <button type="submit" style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 42,
              background: search ? 'var(--accent)' : 'rgba(255,255,255,0.07)',
              border: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={search ? '#fff' : 'var(--topbar-muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            <button onClick={toggleTheme} style={{
              width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.07)',
              border: 'none', cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {dark ? '☀️' : '🌙'}
            </button>
            {user && (
              <button onClick={() => router.push('/dashboard')} style={{
                padding: '7px 16px', borderRadius: 8, background: 'var(--accent)',
                color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              }}>
                Dashboard →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{ background: 'var(--topbar-bg)', padding: '80px 20px', textAlign: 'center', borderBottom: '1px solid var(--topbar-border)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 99, marginBottom: 20,
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
            fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)',
          }}>
            🚀 Professional Seller Dashboard
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--topbar-text)', lineHeight: 1.15, marginBottom: 16 }}>
            Sell Smarter with <span style={{ color: 'var(--accent)' }}>CartX</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--topbar-muted)', marginBottom: 32, lineHeight: 1.6 }}>
            Manage products, track inventory, analyze performance, and grow your business — all in one professional dashboard.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push(user ? '/dashboard' : '/login')} style={{
              padding: '12px 28px', borderRadius: 10, background: 'var(--accent)',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
            }}>
              {user ? 'Go to Dashboard' : 'Sign In'}
            </button>
            {!user && (
              <button onClick={() => router.push('/signup')} style={{
                padding: '12px 28px', borderRadius: 10,
                background: 'rgba(255,255,255,0.08)', color: 'var(--topbar-text)',
                border: '1px solid rgba(255,255,255,0.16)', cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
              }}>
                Create Account
              </button>
            )}
            <button onClick={() => router.push('/products')} style={{
              padding: '12px 28px', borderRadius: 10,
              background: 'rgba(255,255,255,0.08)', color: 'var(--topbar-text)',
              border: '1px solid rgba(255,255,255,0.16)', cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
            }}>
              Browse Products
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Everything you need to sell</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Built for modern sellers who demand professional tools</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="card fade-in" style={{ padding: 24 }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px 40px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Shop by Category</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {CATEGORIES.map(cat => (
            <button key={cat}
              onClick={() => router.push(`/products?category=${encodeURIComponent(cat)}`)}
              style={{
                padding: '8px 18px', borderRadius: 99, fontSize: '0.875rem', fontWeight: 500,
                background: 'var(--surface)', color: 'var(--text-secondary)',
                border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured Products ───────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>⭐ Top Rated Products</h2>
          <button onClick={() => router.push('/products')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: '0.875rem' }}>
            View all →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {featured.map(p => (
            <div key={p._id} className="card fade-in" style={{ overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => router.push(`/products/${p._id}`)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ height: 150, background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                {p.image
                  ? <img src={p.image} alt={p.title} style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: '2.5rem' }}>📦</span>}
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.title}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{p.category}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ⭐ {Number(p.ratingsAverage || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      {!user && (
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px 60px' }}>
          <div style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 16, padding: '48px 32px', textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10 }}>Ready to start selling?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '1rem' }}>Join sellers using CartX to manage their business professionally.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/signup')} style={{ padding: '11px 28px', borderRadius: 10, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9375rem' }}>
                Create Free Account
              </button>
              <button onClick={() => router.push('/login')} style={{ padding: '11px 28px', borderRadius: 10, background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1.5px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem' }}>
                Sign In
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--topbar-bg)', borderTop: '1px solid var(--topbar-border)', padding: '28px 20px', textAlign: 'center' }}>
        <CartXLogo white size="sm" />
        <p style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--topbar-muted)' }}>
          © {new Date().getFullYear()} CartX. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
