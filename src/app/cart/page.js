'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../components/AppShell'
import { api } from '../components/api'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'

export default function CartPage() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading]     = useState(true)
  const [updating, setUpdating]   = useState(null)
  const { refresh: refreshCart }  = useCart()
  const router = useRouter()

  useEffect(() => {
    api.getCart()
      .then(({ ok, data }) => {
        if (ok) setCartItems(Array.isArray(data) ? data : (data.items || []))
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleQty(id, newQty) {
    if (newQty < 1) return
    setUpdating(id)
    const { ok, data } = await api.updateCartItem(id, newQty)
    if (ok) { setCartItems(prev => prev.map(i => String(i._id) === id ? { ...i, quantity: newQty } : i)); refreshCart() }
    else toast.error(data.message || 'Failed to update', { id: 'cart-upd' })
    setUpdating(null)
  }

  async function handleRemove(id) {
    setUpdating(id)
    const { ok, data } = await api.removeCartItem(id)
    if (ok) { setCartItems(prev => prev.filter(i => String(i._id) !== id)); toast.success('Removed', { id: 'cart-rm' }); refreshCart() }
    else toast.error(data.message || 'Failed to remove', { id: 'cart-rm-err' })
    setUpdating(null)
  }

  const total = cartItems.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>My Cart</h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 36, height: 36, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="card fade-in" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '3.5rem', marginBottom: 16 }}>🛒</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Your cart is empty</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 24 }}>Add some products to get started</p>
            <button onClick={() => router.push('/products')} className="btn-primary">Browse Products</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Items */}
            <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cartItems.map(item => (
                <div key={String(item._id)} className="card fade-in" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 10, background: 'var(--surface-raised)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.product?.image
                      ? <img src={item.product.image} alt={item.product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '2rem' }}>📦</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product?.title}
                    </p>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', margin: '0 0 10px' }}>
                      ₹{Number(item.product?.price || 0).toLocaleString('en-IN')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => handleQty(String(item._id), item.quantity - 1)}
                        disabled={updating === String(item._id) || item.quantity <= 1}
                        style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        −
                      </button>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => handleQty(String(item._id), item.quantity + 1)}
                        disabled={updating === String(item._id)}
                        style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        +
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                      ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                    </p>
                    <button onClick={() => handleRemove(String(item._id))} disabled={updating === String(item._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.8rem', fontWeight: 500 }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ width: 280, flexShrink: 0 }}>
              <div className="card" style={{ padding: 22, position: 'sticky', top: 80 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>Order Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <span>Items ({cartItems.length})</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <span>Delivery</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span>Total</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button className="btn-primary" style={{ width: '100%', padding: '11px 0', fontSize: '0.9375rem' }}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
