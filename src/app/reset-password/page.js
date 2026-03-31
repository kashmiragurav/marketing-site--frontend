'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function ResetPasswordForm() {
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState('')
  const [success,         setSuccess]         = useState('')
  const [loading,         setLoading]         = useState(false)
  const [token,           setToken]           = useState('')

  const searchParams = useSearchParams()
  const router       = useRouter()

  useEffect(() => {
    const t = searchParams.get('token')
    if (!t) setError('Invalid or missing reset token. Please request a new reset link.')
    else     setToken(t)
  }, [searchParams])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newPassword || !confirmPassword) { setError('Please fill in all fields.'); return }
    if (newPassword.length < 6)           { setError('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword)  { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, newPassword }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.message || 'Something went wrong.'); return }
      setSuccess(data.message)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Cannot connect to server. Is your backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-full mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text">Reset password</h1>
          <p className="text-sm text-text-muted mt-1">Enter your new password below</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-error-light border border-error text-error text-sm px-4 py-3 rounded-lg mb-5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.75a.75.75 0 001.5 0V8a.75.75 0 00-1.5 0v4.25zm.75 2.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success-light rounded-full mb-4">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text mb-2">Password reset!</h2>
            <p className="text-sm text-text-muted mb-2">{success}</p>
            <p className="text-sm text-text-muted">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">New password</label>
              <input type="password" placeholder="••••••••" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
              <p className="text-xs text-text-muted">Minimum 6 characters</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Confirm new password</label>
              <input type="password" placeholder="••••••••" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" />
            </div>

            {confirmPassword && (
              <p className={`text-xs -mt-3 ${newPassword === confirmPassword ? 'text-success' : 'text-error'}`}>
                {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}

            <button type="submit" disabled={loading || !token}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition">
              {loading ? 'Resetting...' : 'Reset password'}
            </button>

            <p className="text-center text-sm text-text-muted">
              Remember your password?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">Back to login</a>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}

// Wrap in Suspense — required by Next.js when useSearchParams is used
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
