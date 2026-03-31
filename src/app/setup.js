// This file was created in wrong location — see root setup.js
const fs   = require('fs')
const path = require('path')
const base = path.join(__dirname, 'src', 'app')

// Ensure dirs exist
;[
  path.join(__dirname, 'src', 'lib'),
  path.join(__dirname, 'src', 'hooks'),
  path.join(base, 'inventory'),
].forEach(dir => {
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); console.log('Created:', dir) }
})

// Stub pages (only if missing)
const stubs = {
  'profile/page.js':  `'use client'\nimport P from '../../components/ProfilePage'\nexport default function ProfilePage() { return <P /> }\n`,
  'settings/page.js': `'use client'\nimport S from '../../components/SettingsPage'\nexport default function SettingsPage() { return <S /> }\n`,
  'orders/page.js':   `'use client'\nimport O from '../../components/OrdersPage'\nexport default function OrdersPage() { return <O /> }\n`,
  'reports/page.js':  `'use client'\nimport R from '../../components/ReportsPage'\nexport default function ReportsPage() { return <R /> }\n`,
}
Object.entries(stubs).forEach(([rel, content]) => {
  const fp = path.join(base, rel)
  if (!fs.existsSync(fp)) { fs.writeFileSync(fp, content, 'utf8'); console.log('Created:', fp) }
})

// Inventory page — always overwrite with latest
fs.writeFileSync(path.join(base, 'inventory', 'page.js'), `'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import AppShell from '../components/AppShell'
import { api } from '../components/api'
import toast from 'react-hot-toast'

export default function InventoryPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [products, setProducts]       = useState([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)
  const [hasMore, setHasMore]         = useState(true)
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch]           = useState('')
  const [deleting, setDeleting]       = useState(null)
  const [confirmId, setConfirmId]     = useState(null)
  const [editProduct, setEditProduct] = useState(null)
  const [saving, setSaving]           = useState(false)

  const observerRef = useRef(null)
  const sentinelRef = useRef(null)

  const fetchPage = useCallback(async (pg, replace = false) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    const { ok, data } = await api.getProducts({ page: pg, limit: 15, ...(search && { search }) })
    if (ok) {
      const incoming = data.products || []
      setProducts(prev => replace ? incoming : [...prev, ...incoming])
      setTotal(data.total || 0)
      setHasMore(pg < (data.totalPages || 1))
      setPage(pg)
    } else {
      toast.error('Failed to load products', { id: 'inv-load' })
    }
    setLoading(false)
    setLoadingMore(false)
  }, [search])

  useEffect(() => { fetchPage(1, true) }, [search])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) fetchPage(page + 1, false)
    }, { threshold: 0.1 })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, loading, page, fetchPage])

  // Ownership check — only owner can edit/delete
  function canModify(product) {
    if (!user) return false
    const owner = product.createdBy?._id || product.createdBy
    return String(owner) === String(user._id) || user.role === 'admin'
  }

  async function handleDelete(id) {
    setDeleting(id)
    const { ok, data } = await api.deleteProduct(id)
    if (ok) {
      toast.success('Product removed', { id: 'del-' + id })
      setProducts(prev => prev.filter(p => String(p._id) !== id))
      setTotal(prev => prev - 1)
    } else {
      toast.error(data.message || 'Delete failed', { id: 'del-err-' + id })
    }
    setDeleting(null); setConfirmId(null)
  }

  async function handleSave() {
    setSaving(true)
    const { ok, data } = await api.updateProduct(editProduct._id, {
      title: editProduct.title, description: editProduct.description,
      price: Number(editProduct.price), category: editProduct.category,
      image: editProduct.image, stock: Number(editProduct.stock),
      brand: editProduct.brand, sku: editProduct.sku,
    })
    if (ok) {
      toast.success('Product updated', { id: 'upd-' + editProduct._id })
      setProducts(prev => prev.map(p => String(p._id) === String(editProduct._id) ? data.product : p))
      setEditProduct(null)
    } else {
      toast.error(data.message || 'Update failed', { id: 'upd-err' })
    }
    setSaving(false)
  }

  const inp = { background: 'var(--color-input-bg)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Manage Products</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{total} products</p>
          </div>
          <button onClick={() => router.push('/admin/products/add')}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            + Add Product
          </button>
        </div>

        <input type="text" placeholder="Search by title..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, maxWidth: 320, marginBottom: 16 }} />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-card)' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 6 }} /><div className="skeleton" style={{ height: 10, width: '30%' }} /></div>
                <div className="skeleton" style={{ height: 12, width: 60 }} />
                <div className="skeleton" style={{ height: 28, width: 80, borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>📦</p>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No products found</p>
          </div>
        ) : (
          <>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-card)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                      {['Image','Title','Category','Price','Stock','Rating','Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={String(p._id)} style={{ borderBottom: '1px solid var(--color-border)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.image ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '1.2rem' }}>📦</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', maxWidth: 180 }}>
                          <p style={{ fontWeight: 600, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                          {p.brand && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>{p.brand}</p>}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{p.category || '—'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-text)' }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600,
                            background: p.stock > 5 ? 'var(--color-success-light)' : p.stock > 0 ? 'var(--color-warning-light)' : 'var(--color-error-light)',
                            color:      p.stock > 5 ? 'var(--color-success)'       : p.stock > 0 ? 'var(--color-warning)'       : 'var(--color-error)',
                          }}>{p.stock > 0 ? p.stock : 'Out'}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>
                          ⭐ {Number(p.ratingsAverage || 0).toFixed(1)} ({p.ratingsCount || 0})
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {canModify(p) ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => setEditProduct({ ...p })}
                                style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}>
                                Edit
                              </button>
                              {confirmId === String(p._id) ? (
                                <>
                                  <button onClick={() => handleDelete(String(p._id))} disabled={deleting === String(p._id)}
                                    style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', background: 'var(--color-error)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                                    {deleting === String(p._id) ? '...' : 'Confirm'}
                                  </button>
                                  <button onClick={() => setConfirmId(null)}
                                    style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => setConfirmId(String(p._id))}
                                  style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', background: 'var(--color-error-light)', color: 'var(--color-error)', border: '1px solid var(--color-error)', cursor: 'pointer' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-error)'; e.currentTarget.style.color = '#fff' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-error-light)'; e.currentTarget.style.color = 'var(--color-error)' }}>
                                  Delete
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div ref={sentinelRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
              {loadingMore && <div style={{ width: 20, height: 20, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
              {!hasMore && products.length > 0 && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>All products loaded</p>}
            </div>
            <style>{\`@keyframes spin { to { transform: rotate(360deg); } }\`}</style>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.55)' }}>
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Edit Product</h2>
              <button onClick={() => setEditProduct(null)} style={{ background: 'none', color: 'var(--color-text-muted)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Title',     key: 'title',    type: 'text'   },
                { label: 'Price (₹)', key: 'price',    type: 'number' },
                { label: 'Stock',     key: 'stock',    type: 'number' },
                { label: 'Category',  key: 'category', type: 'text'   },
                { label: 'Brand',     key: 'brand',    type: 'text'   },
                { label: 'SKU',       key: 'sku',      type: 'text'   },
                { label: 'Image URL', key: 'image',    type: 'text'   },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input type={type} value={editProduct[key] ?? ''}
                    onChange={e => setEditProduct(prev => ({ ...prev, [key]: e.target.value }))}
                    style={inp} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea rows={3} value={editProduct.description ?? ''}
                  onChange={e => setEditProduct(prev => ({ ...prev, description: e.target.value }))}
                  style={{ ...inp, resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: '0.875rem', fontWeight: 700, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditProduct(null)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: '0.875rem', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
`, 'utf8')
console.log('Written: inventory/page.js')
console.log('\n✅ CartX setup complete! Run: npm run dev')
