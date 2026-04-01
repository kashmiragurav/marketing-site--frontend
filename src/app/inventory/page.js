'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import AppShell from '../components/AppShell'
import { api } from '../components/api'
import toast from 'react-hot-toast'
import { useInfiniteProducts } from '../../hooks/useInfiniteProducts'
import { CATEGORIES } from '../../lib/constants'

export default function InventoryPage() {
  const router   = useRouter()
  const { user } = useAuth()

  const [search, setSearch]           = useState('')
  const [deleting, setDeleting]       = useState(null)
  const [confirmId, setConfirmId]     = useState(null)
  const [editProduct, setEditProduct] = useState(null)
  const [saving, setSaving]           = useState(false)

  // ── Data — cursor-based infinite scroll via shared hook ──────────────────
  const { products, loading, loadingMore, hasMore, loadMore, setProducts } =
    useInfiniteProducts({ search })

  // ── Infinite scroll — callback ref attaches observer when sentinel mounts ─
  // loadMoreRef keeps latest loadMore without recreating the observer
  const loadMoreRef = useRef(loadMore)
  useEffect(() => { loadMoreRef.current = loadMore }, [loadMore])

  const observerRef = useRef(null)
  const sentinelRef = useCallback(node => {
    if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null }
    if (!node) return
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current() },
      { rootMargin: '400px', threshold: 0 }
    )
    observerRef.current.observe(node)
  }, []) // stable — loadMoreRef.current is always current

  // ── Permissions — normalise role to handle ADMIN / admin / SUPER_ADMIN ───
  function canModify(product) {
    if (!user) return false
    const role  = (user.role || '').toLowerCase()
    const owner = product.createdBy?._id || product.createdBy
    return role === 'admin' || role === 'super_admin' ||
           (owner && String(owner) === String(user._id)) || !owner
  }

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  async function handleDelete(id) {
    setDeleting(id)
    const { ok, data } = await api.deleteProduct(id)
    if (ok) {
      toast.success('Product removed', { id: 'del-' + id })
      setProducts(prev => prev.filter(p => String(p._id) !== id))
      setConfirmId(null)
    } else {
      toast.error(data?.message || 'Delete failed', { id: 'del-err' })
    }
    setDeleting(null)
  }

  async function handleSave() {
    setSaving(true)
    const { ok, data } = await api.updateProduct(editProduct._id, {
      title:       editProduct.title,
      description: editProduct.description,
      price:       Number(editProduct.price),
      category:    editProduct.category,
      image:       editProduct.image,
      stock:       Number(editProduct.stock),
      brand:       editProduct.brand,
      sku:         editProduct.sku,
    })
    if (ok) {
      toast.success('Product updated', { id: 'upd-' + editProduct._id })
      setProducts(prev => prev.map(p =>
        String(p._id) === String(editProduct._id) ? data.product : p
      ))
      setEditProduct(null)
    } else {
      toast.error(data?.message || 'Update failed', { id: 'upd-err' })
    }
    setSaving(false)
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const inp = {
    background: 'var(--input-bg)', color: 'var(--input-text)',
    border: '1.5px solid var(--input-border)', borderRadius: 8,
    padding: '8px 12px', fontSize: '0.875rem', width: '100%', outline: 'none',
  }
  const th = {
    textAlign: 'left', padding: '10px 14px', fontSize: '0.72rem',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
    color: 'var(--text-muted)',
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Manage Products
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {loading ? '…' : `${products.length}${hasMore ? '+' : ''} products`}
            </p>
          </div>
          <button onClick={() => router.push('/admin/products/add')}
            className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.875rem' }}>
            + Add Product
          </button>
        </div>

        {/* Search */}
        <input
          type="text" placeholder="Search by title or brand…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, maxWidth: 340, marginBottom: 18 }}
        />

        {/* Skeleton — initial load only */}
        {loading && (
          <div className="card" style={{ overflow: 'hidden' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 12, width: '55%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 10, width: '30%' }} />
                </div>
                <div className="skeleton" style={{ height: 12, width: 60 }} />
                <div className="skeleton" style={{ height: 28, width: 90, borderRadius: 8 }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No products found</p>
          </div>
        )}

        {/* Table — rendered as soon as first batch arrives */}
        {products.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ background: 'var(--surface-raised)', borderBottom: '1.5px solid var(--border)' }}>
                  <tr>
                    {['Image', 'Title', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr
                      key={String(p._id)}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-raised)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.image
                            ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            : <span style={{ fontSize: '1.2rem' }}>📦</span>}
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                        {p.brand && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{p.brand}</p>}
                      </td>

                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{p.category || '—'}</td>

                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{Number(p.price).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span className="badge" style={{
                          background: p.stock > 5 ? 'var(--success-bg)' : p.stock > 0 ? 'var(--warning-bg)' : 'var(--error-bg)',
                          color:      p.stock > 5 ? 'var(--success)'    : p.stock > 0 ? 'var(--warning)'    : 'var(--error)',
                        }}>
                          {p.stock > 0 ? p.stock : 'Out'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                        ⭐ {Number(p.ratingsAverage || 0).toFixed(1)} ({p.ratingsCount || 0})
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        {canModify(p) ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => setEditProduct({ ...p })}
                              className="btn-ghost" style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                            >
                              Edit
                            </button>
                            {confirmId === String(p._id) ? (
                              <>
                                <button
                                  onClick={() => handleDelete(String(p._id))}
                                  disabled={deleting === String(p._id)}
                                  style={{ padding: '5px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, background: 'var(--error)', color: '#fff', border: 'none', cursor: 'pointer' }}
                                >
                                  {deleting === String(p._id) ? '…' : 'Confirm'}
                                </button>
                                <button onClick={() => setConfirmId(null)} className="btn-ghost" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button onClick={() => setConfirmId(String(p._id))} className="btn-danger" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                                Delete
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-disabled)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sentinel — ALWAYS outside all conditionals so observer never loses its target */}
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

        {/* Footer status */}
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          {loadingMore && (
            <div style={{ width: 22, height: 22, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
          )}
          {!loading && !loadingMore && !hasMore && products.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All products loaded</p>
          )}
        </div>

      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.6)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Edit Product</h2>
              <button onClick={() => setEditProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Title',     key: 'title',    type: 'text'   },
                { label: 'Price (₹)', key: 'price',    type: 'number' },
                { label: 'Stock',     key: 'stock',    type: 'number' },
                { label: 'Brand',     key: 'brand',    type: 'text'   },
                { label: 'SKU',       key: 'sku',      type: 'text'   },
                { label: 'Image URL', key: 'image',    type: 'text'   },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                  <input
                    type={type} value={editProduct[key] ?? ''}
                    onChange={e => setEditProduct(prev => ({ ...prev, [key]: e.target.value }))}
                    style={inp}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</label>
                <select
                  value={editProduct.category ?? ''}
                  onChange={e => setEditProduct(prev => ({ ...prev, category: e.target.value }))}
                  style={inp}
                >
                  <option value="">— Select —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</label>
                <textarea
                  rows={3} value={editProduct.description ?? ''}
                  onChange={e => setEditProduct(prev => ({ ...prev, description: e.target.value }))}
                  style={{ ...inp, resize: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '11px 0', fontSize: '0.9375rem' }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditProduct(null)} className="btn-ghost" style={{ flex: 1, padding: '11px 0', fontSize: '0.9375rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
