'use client'

import { useEffect, useState } from 'react'
import AppShell from '../app/components/AppShell'
import { api } from '../app/components/api'

const STATUS_STYLE = {
  Delivered:  { bg: 'var(--success-bg)', color: 'var(--success)' },
  Processing: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  Shipped:    { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  Cancelled:  { bg: 'var(--error-bg)',   color: 'var(--error)'   },
}

const th = {
  textAlign: 'left', padding: '10px 16px',
  fontSize: '0.75rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  color: 'var(--text-muted)',
}

export default function OrdersPageContent() {
  const [orders, setOrders]   = useState([])
  const [summary, setSummary] = useState(null)   // backend-provided counts
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    api.getOrders()
      .then(({ ok, data }) => {
        if (!ok) { setApiError(true); return }
        // Backend returns { orders, total, summary: { total, delivered, shipped, processing, cancelled } }
        setOrders(Array.isArray(data) ? data : (data.orders || []))
        setSummary(data.summary || null)
      })
      .catch(() => setApiError(true))
      .finally(() => setLoading(false))
  }, [])

  // Summary cards — values from backend.summary when available, else from orders array length
  const cards = [
    { label: 'Total',      value: summary?.total      ?? orders.length,                                       icon: '📋' },
    { label: 'Delivered',  value: summary?.delivered  ?? orders.filter(o => o.status === 'Delivered').length, icon: '✅' },
    { label: 'In Transit', value: summary?.shipped    ?? orders.filter(o => o.status === 'Shipped').length,   icon: '🚚' },
    { label: 'Processing', value: summary?.processing ?? orders.filter(o => o.status === 'Processing').length,icon: '⏳' },
  ]

  return (
    <AppShell>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Orders</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {loading ? 'Loading…' : `${summary?.total ?? orders.length} order${(summary?.total ?? orders.length) !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}
          className="grid grid-cols-2 sm:grid-cols-4">
          {cards.map(({ label, value, icon }) => (
            <div key={label} className="card fade-in" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: 0 }}>{label}</p>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              </div>
              {loading
                ? <div className="skeleton" style={{ height: 28, width: 40 }} />
                : <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
              }
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="card" style={{ overflow: 'hidden' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ height: 12, width: 100 }} />
                <div className="skeleton" style={{ height: 12, width: 80 }} />
                <div className="skeleton" style={{ height: 12, width: 60, marginLeft: 'auto' }} />
                <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 99 }} />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="card fade-in" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '3rem', marginBottom: 12 }}>📋</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No orders yet</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {apiError
                ? 'Orders API is not connected. Configure your backend to see live data.'
                : 'Orders will appear here once customers start purchasing.'}
            </p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ background: 'var(--surface-raised)', borderBottom: '1.5px solid var(--border)' }}>
                  <tr>
                    {['Order ID', 'Date', 'Items', 'Total', 'Status', 'Action'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const s   = STATUS_STYLE[order.status] || STATUS_STYLE.Processing
                    const oid = order._id || order.id || '—'
                    return (
                      <tr key={oid} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-raised)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)', fontSize: '0.8rem' }}>
                          #{String(oid).slice(-8).toUpperCase()}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : order.date || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                          {order.itemCount ?? order.items?.length ?? '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{Number(order.totalAmount ?? order.total ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge" style={{ background: s.bg, color: s.color }}>
                            {order.status || 'Processing'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>View</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
