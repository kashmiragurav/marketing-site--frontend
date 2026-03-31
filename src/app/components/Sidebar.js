'use client'

import { useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const ALL_NAV = [
  { href: '/dashboard',  label: 'Dashboard',      icon: '▦',  roles: null },
  { href: '/inventory',  label: 'Manage Products', icon: '📦', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { href: '/products',   label: 'Products',        icon: '🛍', roles: null },
  { href: '/orders',     label: 'Orders',          icon: '📋', roles: null },
  { href: '/reports',    label: 'Reports',         icon: '📊', roles: null },
  { href: '/profile',    label: 'Profile',         icon: '👤', roles: null },
  { href: '/settings',   label: 'Settings',        icon: '⚙',  roles: null },
]

export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { dark, toggleTheme } = useTheme()
  const { user, logout }      = useAuth()
  const { reset: resetCart }   = useCart()

  const [expanded, setExpanded] = useState(false)
  const leaveTimer = useRef(null)

  function onEnter() { clearTimeout(leaveTimer.current); setExpanded(true) }
  function onLeave() { leaveTimer.current = setTimeout(() => setExpanded(false), 220) }
  async function handleLogout() { await logout(); resetCart(); router.replace('/') }

  const w = expanded ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)'

  return (
    <aside
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        width: w, minWidth: w,
        background: 'var(--sidebar-bg)',
        borderRight: '1.5px solid var(--sidebar-border)',
        transition: 'width 0.22s ease, min-width 0.22s ease',
        overflow: 'hidden',
        position: 'fixed', left: 0, top: 0,
        height: '100vh', zIndex: 40,
        display: 'flex', flexDirection: 'column',
        boxShadow: dark ? 'none' : '2px 0 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: expanded ? 'flex-start' : 'center',
        padding: expanded ? '0 16px' : 0,
        minHeight: 56,
        borderBottom: '1.5px solid var(--sidebar-border)',
        flexShrink: 0,
        cursor: 'pointer',
      }} onClick={() => router.push('/')}>
        {expanded ? (
          <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--sidebar-name)' }}>
            Cart<span style={{ color: 'var(--accent)' }}>X</span>
          </span>
        ) : (
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent)' }}>X</span>
        )}
      </div>

      {/* ── User chip ────────────────────────────────────────── */}
      {expanded && user && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1.5px solid var(--sidebar-border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.875rem', fontWeight: 700, flexShrink: 0,
            }}>
              {(user.name || user.email)?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '0.8125rem', fontWeight: 600, margin: 0,
                color: 'var(--sidebar-name)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.name || user.email}
              </p>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600,
                padding: '1px 8px', borderRadius: 99,
                background: 'var(--accent-light)',
                color: 'var(--accent-text)',
                textTransform: 'capitalize',
                display: 'inline-block', marginTop: 2,
              }}>
                {user.role || 'USER'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {ALL_NAV.filter(({ roles }) => !roles || roles.includes(user?.role)).map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              title={!expanded ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: expanded ? 10 : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '9px 12px' : '9px 0',
                borderRadius: 8, width: '100%',
                fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.12s, color 0.12s',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)' } }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}>{icon}</span>
              {expanded && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* ── Bottom ───────────────────────────────────────────── */}
      <div style={{ padding: '6px', borderTop: '1.5px solid var(--sidebar-border)', flexShrink: 0 }}>
        <button
          onClick={toggleTheme}
          title={dark ? 'Light mode' : 'Dark mode'}
          style={{
            display: 'flex', alignItems: 'center',
            gap: expanded ? 10 : 0,
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '9px 12px' : '9px 0',
            borderRadius: 8, width: '100%', marginBottom: 2,
            fontSize: '0.875rem', fontWeight: 500,
            background: 'transparent', color: 'var(--sidebar-text)',
            border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)' }}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{dark ? '☀️' : '🌙'}</span>
          {expanded && <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            display: 'flex', alignItems: 'center',
            gap: expanded ? 10 : 0,
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '9px 12px' : '9px 0',
            borderRadius: 8, width: '100%',
            fontSize: '0.875rem', fontWeight: 500,
            background: 'transparent', color: 'var(--error)',
            border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>⏻</span>
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
