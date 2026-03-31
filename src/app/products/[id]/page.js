'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { useCart } from '../../../context/CartContext'
import AppShell from '../../components/AppShell'
import { api } from '../../components/api'
import toast from 'react-hot-toast'

const T = {
  bg:       'var(--bg)',
  surface:  'var(--surface)',
  raised:   'var(--surface-raised)',
  border:   'var(--border)',
  text:     'var(--text-primary)',
  secondary:'var(--text-secondary)',
  muted:    'var(--text-muted)',
  accent:   'var(--accent)',
  success:  'var(--success)',
  error:    'var(--error)',
  errorBg:  'var(--error-bg)',
  inputBg:  'var(--input-bg)',
  inputText:'var(--input-text)',
  inputBorder:'var(--input-border)',
}

function StarRow({ value, max = 5, size = '1rem', interactive = false, hovered = 0, onHover, onClick }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          onClick={() => interactive && onClick?.(s)}
          onMouseEnter={() => interactive && onHover?.(s)}
          onMouseLeave={() => interactive && onHover?.(0)}
          style={{
            fontSize: size,
            color: (interactive ? (hovered >= s || value >= s) : Math.round(value) >= s) ? '#f59e0b' : T.border,
            cursor: interactive ? 'pointer' : 'default',
            lineHeight: 1,
          }}
        >★</span>
      ))}
    </div>
  )
}

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: T.muted, minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: T.text }}>{value}</span>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const { user } = useAuth()
  const { refresh: refreshCart } = useCart()

  const [product, setProduct]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [qty, setQty]               = useState(1)
  const [adding, setAdding]         = useState(false)
  const [activeImg, setActiveImg]   = useState(0)
  const [rating, setRating]         = useState(0)
  const [hovered, setHovered]       = useState(0)
  const [comment, setComment]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.getProduct(id)
      .then(({ ok, data }) => {
        if (ok) setProduct(data)
        else toast.error('Product not found.', { id: 'prod-404' })
      })
      .catch(() => toast.error('Failed to load product.', { id: 'prod-err' }))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAddToCart() {
    if (!user) { router.push('/login'); return }
    setAdding(true)
    const { ok, data } = await api.addToCart({ productId: id, quantity: qty })
    if (ok) { toast.success(`${qty} item${qty > 1 ? 's' : ''} added to cart!`, { id: 'add-cart' }); refreshCart() }
    else toast.error(data.message || 'Failed to add to cart', { id: 'add-cart-err' })
    setAdding(false)
  }

  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!rating) { toast.error('Please select a star rating.', { id: 'rev-err' }); return }
    setSubmitting(true)
    const { ok, data } = await api.addReview(id, { rating, comment })
    if (ok) {
      toast.success('Review submitted!', { id: 'rev-ok' })
      // Re-fetch product to get updated reviews with populated user refs
      const { ok: ok2, data: d2 } = await api.getProduct(id)
      if (ok2) setProduct(d2)
      else setProduct(prev => ({ ...prev, ratingsAverage: data.ratingsAverage, ratingsCount: data.ratingsCount }))
      setRating(0); setComment('')
    } else {
      toast.error(data.message || 'Failed to submit review.', { id: 'rev-fail' })
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this product? It will be deactivated.')) return
    const { ok, data } = await api.deleteProduct(id)
    if (ok) { toast.success('Product deleted', { id: 'del-ok' }); router.push('/inventory') }
    else toast.error(data.message || 'Delete failed', { id: 'del-err' })
  }

  // Role-based controls
  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isOwner   = canManage && product && String(product.createdBy?._id || product.createdBy) === String(user?.userId || user?._id)
  const canEdit   = user?.role === 'SUPER_ADMIN' || isOwner

  if (loading) return (
    <PageWrapper user={user} router={router}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${T.accent}`, borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
      </div>
    </PageWrapper>
  )

  if (!product) return (
    <PageWrapper user={user} router={router}>
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: 8 }}>😕</p>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>Product not found</p>
        <button onClick={() => router.push('/products')} style={{ padding: '8px 20px', borderRadius: 8, background: T.accent, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Browse Products
        </button>
      </div>
    </PageWrapper>
  )

  const inStock   = product.stock > 0
  const allImages = [...(product.image ? [product.image] : []), ...(product.images || [])].filter(Boolean)
  const displayImage = allImages[activeImg] || null

  return (
    <PageWrapper user={user} router={router}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>

        {/* Back */}
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '0.875rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          ← Back
        </button>

        {/* ── Main card ─────────────────────────────────────── */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 20 }}>

          {/* Images */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 300, height: 300, borderRadius: 12, background: T.raised, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}` }}>
              {displayImage
                ? <img src={displayImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: '4rem' }}>📦</span>}
            </div>
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', maxWidth: 300 }}>
                {allImages.map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)} style={{ width: 54, height: 54, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${activeImg === i ? T.accent : T.border}`, background: T.raised }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 260 }}>
            {/* Category + brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {product.category && <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.muted }}>{product.category}</span>}
              {product.brand && <><span style={{ color: T.border }}>·</span><span style={{ fontSize: '0.7rem', color: T.muted }}>by {product.brand}</span></>}
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: T.text, margin: '0 0 12px', lineHeight: 1.3 }}>{product.title}</h1>

            {/* Rating summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <StarRow value={product.ratingsAverage || 0} size="1.1rem" />
              <span style={{ fontSize: '0.8rem', color: T.muted }}>
                {Number(product.ratingsAverage || 0).toFixed(1)} · {product.ratingsCount || 0} review{product.ratingsCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Price */}
            <p style={{ fontSize: '2rem', fontWeight: 800, color: T.text, margin: '0 0 10px' }}>
              ₹{Number(product.price).toLocaleString('en-IN')}
            </p>

            {/* Stock */}
            <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 16px', color: inStock ? T.success : T.error }}>
              {inStock ? `✓ In Stock — ${product.stock} available` : '✗ Out of Stock'}
            </p>

            {/* Description */}
            {product.description && (
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: T.secondary, margin: '0 0 18px', whiteSpace: 'pre-line' }}>
                {product.description}
              </p>
            )}

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 99, border: `1px solid ${T.border}`, background: T.raised, color: T.muted }}>#{tag}</span>
                ))}
              </div>
            )}

            {/* Qty + Add to cart */}
            {inStock && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', background: T.inputBg }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ width: 36, textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: T.text }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ width: 36, height: 36, background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                <button onClick={handleAddToCart} disabled={adding} style={{ flex: 1, maxWidth: 220, padding: '10px 0', borderRadius: 10, fontSize: '0.9rem', fontWeight: 700, border: 'none', cursor: adding ? 'not-allowed' : 'pointer', background: adding ? T.border : T.accent, color: adding ? T.muted : '#fff', transition: 'background 0.15s' }}>
                  {adding ? 'Adding…' : user ? 'Add to Cart' : 'Sign in to Buy'}
                </button>
              </div>
            )}

            {!inStock && (
              <button disabled style={{ padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 700, background: T.border, color: T.muted, border: 'none', marginBottom: 16, cursor: 'not-allowed' }}>
                Out of Stock
              </button>
            )}

            {/* Admin/owner actions */}
            {canEdit && (
              <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                <button onClick={() => router.push('/inventory')} style={{ padding: '7px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, border: `1px solid ${T.border}`, background: T.raised, color: T.text, cursor: 'pointer' }}>
                  ✏️ Edit in Inventory
                </button>
                <button onClick={handleDelete} style={{ padding: '7px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, background: T.errorBg, color: T.error, border: `1px solid ${T.error}`, cursor: 'pointer' }}>
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Product details table ──────────────────────────── */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: T.text, margin: '0 0 16px' }}>Product Details</h2>
          <DetailRow label="Brand"     value={product.brand} />
          <DetailRow label="SKU"       value={product.sku} />
          <DetailRow label="Category"  value={product.category} />
          <DetailRow label="Stock"     value={product.stock !== undefined ? `${product.stock} units` : undefined} />
          <DetailRow label="Tags"      value={product.tags?.length ? product.tags.join(', ') : undefined} />
          <DetailRow label="Listed On" value={product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
          <DetailRow label="Seller"    value={product.createdBy?.name || product.createdBy?.email} />
          {!product.brand && !product.sku && !product.tags?.length && (
            <p style={{ fontSize: '0.8rem', color: T.muted, margin: 0 }}>No additional details available.</p>
          )}
        </div>

        {/* ── Reviews ───────────────────────────────────────── */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: T.text, margin: '0 0 20px' }}>
            Customer Reviews ({product.ratingsCount || 0})
          </h2>

          {/* Write review — only for USER role or any authenticated user */}
          {user ? (
            <form onSubmit={handleSubmitReview} style={{ background: T.raised, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 24 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, margin: '0 0 12px' }}>Write a Review</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                <StarRow value={rating} size="1.6rem" interactive hovered={hovered} onHover={setHovered} onClick={setRating} />
                {rating > 0 && <span style={{ fontSize: '0.8rem', color: T.muted, marginLeft: 8 }}>{rating} star{rating > 1 ? 's' : ''}</span>}
              </div>
              <textarea
                placeholder="Share your experience (optional)…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                style={{ width: '100%', borderRadius: 8, padding: '8px 12px', fontSize: '0.875rem', resize: 'none', marginBottom: 12, background: T.inputBg, color: T.inputText, border: `1px solid ${T.inputBorder}`, outline: 'none', boxSizing: 'border-box' }}
              />
              <button type="submit" disabled={submitting || !rating} style={{ padding: '8px 22px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 700, background: T.accent, color: '#fff', border: 'none', cursor: submitting || !rating ? 'not-allowed' : 'pointer', opacity: !rating ? 0.5 : 1 }}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div style={{ background: T.raised, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: T.muted, margin: 0 }}>
                <button onClick={() => router.push('/login')} style={{ background: 'none', color: T.accent, fontWeight: 600, border: 'none', cursor: 'pointer', padding: 0 }}>Sign in</button>
                {' '}to write a review
              </p>
            </div>
          )}

          {/* Review list — uses populated userId ref for display name */}
          {!product.reviews?.length ? (
            <p style={{ fontSize: '0.875rem', textAlign: 'center', padding: '24px 0', color: T.muted }}>No reviews yet. Be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {product.reviews.map((review, i) => {
                // Use populated userId.name first, then displayName from backend, then userName fallback
                const name = review.userId?.name || review.userId?.email || review.displayName || review.userName || 'Anonymous'
                const initial = name[0]?.toUpperCase() || 'U'
                const isLast = i === product.reviews.length - 1
                return (
                  <div key={review._id || i} style={{ padding: '16px 0', borderBottom: isLast ? 'none' : `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                          {initial}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, margin: 0 }}>{name}</p>
                          <p style={{ fontSize: '0.7rem', color: T.muted, margin: 0 }}>
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                          </p>
                        </div>
                      </div>
                      <StarRow value={review.rating} size="0.9rem" />
                    </div>
                    {review.comment && (
                      <p style={{ fontSize: '0.875rem', color: T.secondary, margin: 0, paddingLeft: 44, lineHeight: 1.6 }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

/* ── Wrapper: AppShell for logged-in, minimal header for public ── */
function PageWrapper({ user, router, children }) {
  if (user) return <AppShell>{children}</AppShell>
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', minHeight: 54, background: 'var(--topbar-bg)', borderBottom: '1px solid var(--topbar-border)' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', padding: 0, border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#e2e8f0' }}>Cart<span style={{ color: 'var(--accent)' }}>X</span></span>
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push('/products')} style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 8, background: 'rgba(255,255,255,0.07)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
          ← Products
        </button>
      </header>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  )
}
