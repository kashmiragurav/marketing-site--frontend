'use client'

import { useEffect, useState } from 'react'
import AppShell from '../app/components/AppShell'
import { api } from '../app/components/api'

// Simple horizontal bar — width driven by backend-provided value/max
function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function KpiCard({ label, value, icon, color, loading }) {
  return (
    <div className="card fade-in" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: 0 }}>{label}</p>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      {loading
        ? <div className="skeleton" style={{ height: 28, width: 80 }} />
        : <p style={{ fontSize: '1.625rem', fontWeight: 800, color, margin: 0 }}>{value ?? '—'}</p>
      }
    </div>
  )
}

export default function ReportsPageContent() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    api.getReportSummary()
      .then(({ ok, data: d }) => {
        if (ok) setData(d)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // KPIs — values come directly from backend, no computation here
  const kpis = [
    { label: 'Catalog Size',       value: data?.total,                                                              icon: '📦', color: 'var(--accent)'       },
    { label: 'Avg. Price',         value: data?.avgPrice        != null ? `₹${data.avgPrice.toLocaleString('en-IN')}` : null, icon: '💰', color: 'var(--success)'      },
    { label: 'Inventory Value',    value: data?.totalInventoryValue != null ? `₹${data.totalInventoryValue.toLocaleString('en-IN')}` : null, icon: '📈', color: 'var(--warning)'      },
    { label: 'Active Categories',  value: data?.categories?.length,                                                 icon: '🗂', color: 'var(--text-primary)' },
  ]

  // Max values for bar widths — derived from backend data, not computed from raw products
  const catMax    = data?.categories    ? Math.max(...data.categories.map(c => c.count),    1) : 1
  const priceMax  = data?.priceBuckets  ? Math.max(...data.priceBuckets.map(b => b.count),  1) : 1
  const ratingMax = data?.ratingBuckets ? Math.max(...data.ratingBuckets.map(b => b.count), 1) : 1

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Reports & Analytics</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>Catalog insights and stock analysis</p>
        </div>

        {error && (
          <div style={{ background: 'var(--error-bg)', border: '1.5px solid var(--error)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: '0.875rem', color: 'var(--error)' }}>
            ⚠️ Could not load report data. Ensure the <code>/reports/summary</code> endpoint is available on your backend.
          </div>
        )}

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}
          className="grid grid-cols-2 lg:grid-cols-4">
          {kpis.map(k => <KpiCard key={k.label} {...k} loading={loading} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}
          className="grid grid-cols-1 lg:grid-cols-2">

          {/* Products by Category */}
          <div className="card fade-in" style={{ padding: 22 }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>📂 Products by Category</h2>
            {loading
              ? [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 28, marginBottom: 10 }} />)
              : !data?.categories?.length
                ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No data</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.categories.map(({ name, count }) => (
                      <div key={name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                        <Bar value={count} max={catMax} color="var(--accent)" />
                      </div>
                    ))}
                  </div>
                )
            }
          </div>

          {/* Price Distribution */}
          <div className="card fade-in" style={{ padding: 22 }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>💰 Price Distribution</h2>
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 28, marginBottom: 10 }} />)
              : !data?.priceBuckets?.length
                ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No data</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.priceBuckets.map(({ range, count }) => (
                      <div key={range}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{range}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                        <Bar value={count} max={priceMax} color="var(--success)" />
                      </div>
                    ))}
                  </div>
                )
            }
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}
          className="grid grid-cols-1 lg:grid-cols-2">

          {/* Rating Distribution */}
          <div className="card fade-in" style={{ padding: 22 }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>⭐ Rating Distribution</h2>
            {loading
              ? [...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 24, marginBottom: 8 }} />)
              : !data?.ratingBuckets?.length
                ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No data</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.ratingBuckets.map(({ label, count }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.8rem', width: 52, textAlign: 'right', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                        <Bar value={count} max={ratingMax} color={label === 'Unrated' ? 'var(--border-strong)' : '#f59e0b'} />
                        <span style={{ fontSize: '0.8rem', width: 28, color: 'var(--text-muted)', flexShrink: 0 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )
            }
          </div>

          {/* Top by Price */}
          <div className="card fade-in" style={{ padding: 22 }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>💎 Highest Priced</h2>
            {loading
              ? [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 36, marginBottom: 8 }} />)
              : !data?.topByPrice?.length
                ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No data</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.topByPrice.map((p, i) => (
                      <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface-raised)' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, width: 20, textAlign: 'center', color: i < 3 ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{p.category || '—'}</p>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                          ₹{Number(p.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )
            }
          </div>
        </div>
      </div>
    </AppShell>
  )
}
