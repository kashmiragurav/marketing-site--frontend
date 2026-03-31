'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { api } from '../components/api'
import CartXLogo from '../components/CartXLogo'
import toast from 'react-hot-toast'

function validate(email, password) {
  const errors = {}
  if (!email.trim())                                    errors.email    = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email    = 'Enter a valid email address'
  if (!password)                                        errors.password = 'Password is required'
  else if (password.length < 6)                         errors.password = 'Password must be at least 6 characters'
  return errors
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p style={{ fontSize: '0.8rem', color: 'var(--error)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>⚠ {msg}</p>
}

export default function LoginPage() {
  const { refresh } = useAuth()
  const { refresh: refreshCart } = useCart()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)
  const router  = useRouter()

  function handleBlur(field) {
    const e = validate(email, password)
    if (e[field]) setErrors(prev => ({ ...prev, [field]: e[field] }))
    else setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const errs = validate(email, password)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    const { ok, data } = await api.login({ email, password, rememberMe: remember })
    if (ok) {
      await refresh()
      refreshCart()
      toast.success('Welcome back!', { id: 'login-ok' })
      router.replace('/dashboard')
    } else {
      setApiError(data.message || 'Invalid email or password. Please try again.')
    }
    setLoading(false)
  }

  const inputStyle = (field) => ({
    background: 'var(--input-bg)',
    color: 'var(--input-text)',
    border: `1.5px solid ${errors[field] ? 'var(--error)' : 'var(--input-border)'}`,
    borderRadius: 8,
    padding: '9px 13px',
    fontSize: '0.9rem',
    width: '100%',
    outline: 'none',
    boxShadow: errors[field] ? '0 0 0 3px rgba(220,38,38,0.1)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  const labelStyle = {
    fontSize: '0.875rem', fontWeight: 600,
    color: 'var(--text-secondary)', display: 'block', marginBottom: 6,
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ marginBottom: 24 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back to Home
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <CartXLogo size="xl" />
          </button>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: '14px 0 6px' }}>
            Sign in to your account
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            New to CartX?{' '}
            <a href="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create account</a>
          </p>
        </div>

        {/* API error banner */}
        {apiError && (
          <div style={{ background: 'var(--error-bg)', border: '1.5px solid var(--error)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--error)', margin: 0 }}>Sign in failed</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--error)', margin: '2px 0 0', opacity: 0.85 }}>{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate autoComplete="off" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Email */}
          <div>
            <label htmlFor="login-email" style={labelStyle}>Email address</label>
            <input
              id="login-email"
              name="login-email-field"
              type="email"
              placeholder="you@example.com"
              autoComplete="off"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              style={inputStyle('email')}
            />
            <FieldError msg={errors.email} />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label htmlFor="login-password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
              <a href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500 }}>Forgot password?</a>
            </div>
            <input
              id="login-password"
              name="login-password-field"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              style={inputStyle('password')}
            />
            <FieldError msg={errors.password} />
          </div>

          {/* Remember me */}
          <label htmlFor="login-remember" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <input
              id="login-remember"
              name="remember"
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ width: 'auto', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            Keep me signed in
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px 0', borderRadius: 10, fontSize: '0.9375rem', fontWeight: 700, background: loading ? 'var(--accent-light)' : 'var(--accent)', color: loading ? 'var(--accent-text)' : '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
