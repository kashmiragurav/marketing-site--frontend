'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../../components/AppShell'
import { api } from '../../components/api'
import { CATEGORIES } from '../../../lib/constants'
import toast from 'react-hot-toast'

const INIT = { title: '', price: '', stock: '', category: '', brand: '', sku: '', image: '', tags: '', description: '' }

function FieldError({ msg }) {
  if (!msg) return null
  return <p style={{ fontSize: '0.8rem', color: 'var(--error)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>⚠ {msg}</p>
}

export default function AddProductPage() {
  const router = useRouter()
  const [form, setForm]     = useState(INIT)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }))
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  function validate() {
    const e = {}
    if (!form.title.trim())       e.title = 'Product title is required'
    if (!form.price)              e.price = 'Price is required'
    else if (Number(form.price) <= 0) e.price = 'Price must be greater than 0'
    if (form.stock && Number(form.stock) < 0) e.stock = 'Stock cannot be negative'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const { ok, data } = await api.createProduct({
      title:       form.title.trim(),
      description: form.description,
      price:       Number(form.price),
      stock:       Number(form.stock) || 0,
      category:    form.category,
      brand:       form.brand,
      sku:         form.sku,
      image:       form.image,
      tags:        form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
    if (ok) {
      toast.success('Product created!', { id: 'prod-create' })
      router.push('/inventory')
    } else {
      toast.error(data.message || 'Failed to create product.', { id: 'prod-err' })
    }
    setSaving(false)
  }

  const inp = (field) => ({
    background: 'var(--input-bg)', color: 'var(--input-text)',
    border: `1.5px solid ${errors[field] ? 'var(--error)' : 'var(--input-border)'}`,
    borderRadius: 8, padding: '9px 13px', fontSize: '0.9rem', width: '100%', outline: 'none',
    boxShadow: errors[field] ? '0 0 0 3px rgba(220,38,38,0.1)' : 'none',
  })
  const lbl = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }

  const lowStock = form.stock !== '' && Number(form.stock) > 0 && Number(form.stock) <= 5

  return (
    <AppShell>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back
        </button>

        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Add New Product</h1>

        <form onSubmit={handleSubmit} noValidate style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Title */}
          <div>
            <label style={lbl}>Product Title <span style={{ color: 'var(--error)' }}>*</span></label>
            <input type="text" placeholder="e.g. Wireless Headphones" id="prod-title" name="title" value={form.title} onChange={set('title')} style={inp('title')} />
            <FieldError msg={errors.title} />
          </div>

          {/* Price + Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Price (₹) <span style={{ color: 'var(--error)' }}>*</span></label>
              <input type="number" placeholder="0.00" id="prod-price" name="price" value={form.price} onChange={set('price')} style={inp('price')} min="0" step="0.01" />
              <FieldError msg={errors.price} />
            </div>
            <div>
              <label style={lbl}>Stock Quantity</label>
              <input type="number" placeholder="0" id="prod-stock" name="stock" value={form.stock} onChange={set('stock')} style={inp('stock')} min="0" />
              {lowStock && <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: 4 }}>⚠ Low stock: only {form.stock} unit{Number(form.stock) !== 1 ? 's' : ''}</p>}
              <FieldError msg={errors.stock} />
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={lbl}>Category</label>
            <select id="prod-category" name="category" value={form.category} onChange={set('category')} style={{ ...inp('category'), cursor: 'pointer' }}>
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Brand + SKU */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Brand</label>
              <input type="text" placeholder="e.g. Sony" id="prod-brand" name="brand" value={form.brand} onChange={set('brand')} style={inp('brand')} />
            </div>
            <div>
              <label style={lbl}>SKU</label>
              <input type="text" placeholder="e.g. SKU-001" id="prod-sku" name="sku" value={form.sku} onChange={set('sku')} style={inp('sku')} />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label style={lbl}>Image URL</label>
            <input type="text" placeholder="https://..." id="prod-image" name="image" value={form.image} onChange={set('image')} style={inp('image')} />
          </div>

          {/* Tags */}
          <div>
            <label style={lbl}>Tags <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>(comma separated)</span></label>
            <input type="text" placeholder="wireless, audio, premium" id="prod-tags" name="tags" value={form.tags} onChange={set('tags')} style={inp('tags')} />
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Description</label>
            <textarea rows={4} placeholder="Describe your product..." id="prod-description" name="description" value={form.description} onChange={set('description')}
              style={{ ...inp('description'), resize: 'vertical' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: '11px 0', borderRadius: 10, fontSize: '0.9375rem', fontWeight: 700,
              background: 'var(--accent)', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Creating…' : 'Create Product'}
            </button>
            <button type="button" onClick={() => router.back()} style={{
              flex: 1, padding: '11px 0', borderRadius: 10, fontSize: '0.9375rem',
              border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
