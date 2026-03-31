'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AppShell from '../app/components/AppShell'
import toast from 'react-hot-toast'

export default function ProfilePageContent() {
  const { user } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')

  function handleSave() {
    toast.success('Profile updated!', { id: 'profile-save' })
    setEditing(false)
  }

  const avatar = (user?.name || user?.email || 'U')[0].toUpperCase()
  const role   = user?.role || 'admin'

  // All tokens via CSS vars — works in both themes
  const card     = { background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }
  const fieldBox = { fontSize: '0.9rem', padding: '9px 13px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', margin: 0, display: 'block', width: '100%' }
  const inp      = { background: 'var(--input-bg)', color: 'var(--input-text)', border: '1.5px solid var(--input-border)', borderRadius: 8, padding: '9px 13px', fontSize: '0.9rem', width: '100%', outline: 'none' }
  const lbl      = { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }

  return (
    <AppShell>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Profile card */}
        <div className="fade-in" style={card}>

          {/* Avatar + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.625rem', fontWeight: 900 }}>
              {avatar}
            </div>
            <div>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {user?.name || 'User'}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '3px 0 8px' }}>
                {user?.email}
              </p>
              <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, padding: '3px 12px', borderRadius: 99, textTransform: 'capitalize', background: 'var(--accent)', color: '#fff' }}>
                {role}
              </span>
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lbl}>Full Name</label>
              {editing
                ? <input id="profile-name" name="name" value={name} onChange={e => setName(e.target.value)} style={inp} />
                : <span style={fieldBox}>{user?.name || '—'}</span>
              }
            </div>
            <div>
              <label style={lbl}>Email Address</label>
              <span style={{ ...fieldBox, color: 'var(--text-muted)' }}>{user?.email}</span>
            </div>
            <div>
              <label style={lbl}>Account Role</label>
              <span style={{ ...fieldBox, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            {editing ? (
              <>
                <button onClick={handleSave} style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  Save Changes
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.9rem', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, border: '1.5px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className="fade-in" style={{ ...card, marginBottom: 0 }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px' }}>Appearance</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Theme</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {dark ? 'Dark mode is on' : 'Light mode is on'}
              </p>
            </div>
            <button onClick={toggleTheme} style={{ padding: '8px 18px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, border: '1.5px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
