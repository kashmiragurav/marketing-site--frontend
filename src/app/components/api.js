/**
 * Centralized API utility — single source of truth for all backend calls.
 * credentials:'include' sends the HttpOnly auth cookie automatically.
 *
 * Import: import { api } from '@/app/components/api'
 *
 * Hapi note: Boom errors return { statusCode, error, message }.
 * normalizeData() flattens this to { message } so all existing
 * callers that read data.message continue to work unchanged.
 */

const BASE = '/api'

// Hapi Boom errors: { statusCode, error, message }
// Express errors:   { message }
// Normalize both to { message } so callers need no changes
function normalizeData(data) {
  if (data && data.statusCode && data.error && data.message) {
    return { message: data.message }
  }
  return data
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  const raw  = await res.json().catch(() => ({}))
  const data = normalizeData(raw)
  return { ok: res.ok, status: res.status, data }
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  me:       ()     => req('/auth/me'),
  login:    (body) => req('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => req('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()     => req('/auth/logout',   { method: 'POST' }),

  // ── Products ──────────────────────────────────────────────────────────────
  // GET /products?page&limit&sortBy&order&search&category&inStock&minPrice&maxPrice&minRating
  // Returns: { products:[...], total, page, totalPages }
  getProducts:   (params) => req(`/products?${new URLSearchParams(params)}`),
  getProduct:    (id)     => req(`/products/${id}`),
  createProduct: (body)   => req('/products',       { method: 'POST',   body: JSON.stringify(body) }),
  updateProduct: (id, b)  => req(`/products/${id}`, { method: 'PUT',    body: JSON.stringify(b) }),
  deleteProduct: (id)     => req(`/products/${id}`, { method: 'DELETE' }),
  rateProduct:   (id, r)  => req(`/products/${id}/rate`,    { method: 'POST', body: JSON.stringify({ rating: r }) }),
  addReview:     (id, b)  => req(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(b) }),

  // ── Cart ──────────────────────────────────────────────────────────────────
  getCart:        ()        => req('/cart'),
  addToCart:      (body)    => req('/cart',       { method: 'POST',   body: JSON.stringify(body) }),
  updateCartItem: (id, qty) => req(`/cart/${id}`, { method: 'PUT',    body: JSON.stringify({ quantity: qty }) }),
  removeCartItem: (id)      => req(`/cart/${id}`, { method: 'DELETE' }),

  // ── Orders ────────────────────────────────────────────────────────────────
  // GET /orders?page&limit&status
  // Returns: { orders:[...], total, summary:{ total, delivered, shipped, processing } }
  getOrders: (params) => req(`/orders?${new URLSearchParams(params || {})}`),
  getOrder:  (id)     => req(`/orders/${id}`),

  // ── Dashboard stats (aggregated — zero frontend calculations) ─────────────
  // GET /dashboard/stats
  // Returns: {
  //   total, inStock, outOfStock, topRated, stockRate,
  //   topRatedProducts:[...5], recentProducts:[...5], lowStockProducts:[...5]
  // }
  getDashboardStats: () => req('/dashboard/stats'),

  // ── Reports summary (aggregated — zero frontend calculations) ─────────────
  // GET /reports/summary
  // Returns: {
  //   total, inStock, outOfStock, avgPrice, totalInventoryValue,
  //   categories:[{ name, count }],
  //   priceBuckets:[{ range, count }],
  //   ratingBuckets:[{ label, count }],
  //   topByPrice:[{ _id, title, category, price }]  ← only needed fields
  // }
  getReportSummary: () => req('/reports/summary'),
}
