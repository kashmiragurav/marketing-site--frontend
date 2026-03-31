'use client'

import { useState } from 'react'
import CartXLogo from '../components/CartXLogo'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email address.'); return }
    setLoading(true)
    try {
      const res  = await fetch('http://localhost:8000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) { setSent(true); toast.success('Reset link sent!') }
      else toast.error(data.message || 'Something went wrong.')
    } catch {
      toast.error('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-3"><CartXLogo size="xl" /></div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Reset your password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="rounded-xl border p-6"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          {sent ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-3">📧</p>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Check your email</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                We sent a reset link to <strong>{email}</strong>
              </p>
              <a href="/login" className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                ← Back to login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Email address</label>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  style={{ background: 'var(--color-input-bg)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 text-sm font-bold rounded-lg"
                style={{ background: 'var(--color-primary)', color: '#111' }}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Remember your password?{' '}
                <a href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
