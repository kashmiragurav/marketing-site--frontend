'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../components/api'
import CartXLogo from '../components/CartXLogo'
import toast from 'react-hot-toast'

function validate(form) {
  const errors = {}
  if (!form.name.trim())                                    errors.name     = 'Full name is required'
  else if (form.name.trim().length < 2)                     errors.name     = 'Name must be at least 2 characters'
  if (!form.email.trim())                                   errors.email    = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email    = 'Enter a valid email address'
  if (!form.password)                                       errors.password = 'Password is required'
  else if (form.password.length < 6)                        errors.password = 'Password must be at least 6 characters'
  if (!form.confirm)                                        errors.confirm  = 'Please confirm your password'
  else if (form.password !== form.confirm)                  errors.confirm  = 'Passwords do not match'
  return errors
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p style={{ fontSize: '0.8rem', color: 'var(--error)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>⚠ {msg}</p>
}

const FIELDS = [
  { label: 'Full Name',        key: 'name',     type: 'text',     ph: 'John Doe',          autoComplete: 'name' },
  { label: 'Email address',    key: 'email',    type: 'email',    ph: 'you@example.com',   autoComplete: 'email' },
  { label: 'Password',         key: 'password', type: 'password', ph: 'Min. 6 characters', autoComplete: 'new-password' },
  { label: 'Confirm Password', key: 'confirm',  type: 'password', ph: 'Re-enter password', autoComplete: 'new-password' },
]

export default function SignupPage() {
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }))
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  function handleBlur(field) {
    const e = validate(form)
    if (e[field]) setErrors(prev => ({ ...prev, [field]: e[field] }))
    else setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    const { ok, data } = await api.register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
    if (ok) {
      toast.success('Account created! Please verify your email.', { id: 'signup-ok' })
      router.push('/login')
    } else {
      setApiError(data.message || 'Registration failed. Please try again.')
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
            Create your CartX account
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</a>
          </p>
        </div>

        {/* API error banner */}
        {apiError && (
          <div style={{ background: 'var(--error-bg)', border: '1.5px solid var(--error)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--error)', margin: 0 }}>Registration failed</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--error)', margin: '2px 0 0', opacity: 0.85 }}>{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FIELDS.map(({ label, key, type, ph, autoComplete }) => (
            <div key={key}>
              <label
                htmlFor={`signup-${key}`}
                style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}
              >
                {label}
              </label>
              <input
                id={`signup-${key}`}
                name={key}
                type={type}
                placeholder={ph}
                autoComplete={autoComplete}
                value={form[key]}
                onChange={set(key)}
                onBlur={() => handleBlur(key)}
                style={inputStyle(key)}
              />
              <FieldError msg={errors[key]} />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px 0', borderRadius: 10, marginTop: 4, fontSize: '0.9375rem', fontWeight: 700, background: loading ? 'var(--accent-light)' : 'var(--accent)', color: loading ? 'var(--accent-text)' : '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  )
}
