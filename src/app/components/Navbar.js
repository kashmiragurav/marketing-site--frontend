'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '../../context/ThemeContext'
import CartXLogo from './CartXLogo'

export default function Navbar({ userEmail, onLogout }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { dark, toggleTheme } = useTheme()

  return (
    <nav className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--color-secondary)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none' }}>
          <CartXLogo white />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="px-2 py-1.5 rounded-lg text-sm"
            style={{ color: '#ccc', background: 'transparent' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          {userEmail && (
            <span className="text-xs hidden md:block truncate max-w-[140px]" style={{ color: '#aaa' }}>
              {userEmail}
            </span>
          )}
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
