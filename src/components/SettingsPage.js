'use client'

import { useTheme } from '../context/ThemeContext'
import AppShell from '../app/components/AppShell'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function SettingsPageContent() {
  const { dark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.replace('/')
  }

  const card = {
    background: 'var(--surface)', border: '1.5px solid var(--border)',
    borderRadius: 12, padding: '20px 22px', marginBottom: 16,
  }
  const sectionTitle = {
    fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12, display: 'block',
  }
  const row = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 0', borderBottom: '1px solid var(--border)',
  }
  const rowLast = { ...row, borderBottom: 'none' }
  const lbl  = { fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }
  const desc = { fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }

  function GhostBtn({ onClick, children, danger }) {
    return (
      <button onClick={onClick} style={{
        padding: '7px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
        background: danger ? 'var(--error-bg)' : 'var(--surface-raised)',
        color: danger ? 'var(--error)' : 'var(--text-primary)',
        border: `1.5px solid ${danger ? 'var(--error)' : 'var(--border)'}`,
      }}>
        {children}
      </button>
    )
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Settings</h1>

        {/* Appearance */}
        <div style={card}>
          <span style={sectionTitle}>Appearance</span>
          <div style={rowLast}>
            <div>
              <p style={lbl}>Theme</p>
              <p style={desc}>{dark ? 'Dark mode is on' : 'Light mode is on'}</p>
            </div>
            <GhostBtn onClick={toggleTheme}>{dark ? '☀️ Light' : '🌙 Dark'}</GhostBtn>
          </div>
        </div>

        {/* Account */}
        <div style={card}>
          <span style={sectionTitle}>Account</span>
          <div style={row}>
            <div>
              <p style={lbl}>Email Address</p>
              <p style={desc}>{user?.email}</p>
            </div>
          </div>
          <div style={row}>
            <div>
              <p style={lbl}>Account Role</p>
              <p style={{ ...desc, textTransform: 'capitalize' }}>{user?.role || 'admin'}</p>
            </div>
          </div>
          <div style={rowLast}>
            <div>
              <p style={lbl}>Change Password</p>
              <p style={desc}>Update your account password</p>
            </div>
            <GhostBtn onClick={() => router.push('/reset-password')}>Reset</GhostBtn>
          </div>
        </div>

        {/* Notifications */}
        <div style={card}>
          <span style={sectionTitle}>Notifications</span>
          {[
            { label: 'Order Updates',  desc: 'Get notified when your orders change status' },
            { label: 'Product Alerts', desc: 'Alerts for low stock and new products' },
            { label: 'Weekly Reports', desc: 'Receive weekly performance summary' },
          ].map(({ label, desc: d }, i, arr) => (
            <div key={label} style={i < arr.length - 1 ? row : rowLast}>
              <div>
                <p style={lbl}>{label}</p>
                <p style={desc}>{d}</p>
              </div>
              {/* Toggle switch */}
              <div style={{ width: 42, height: 24, borderRadius: 99, background: 'var(--accent)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div style={card}>
          <span style={sectionTitle}>Danger Zone</span>
          <div style={rowLast}>
            <div>
              <p style={lbl}>Sign Out</p>
              <p style={desc}>Sign out of your CartX account</p>
            </div>
            <GhostBtn onClick={handleLogout} danger>Sign Out</GhostBtn>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
