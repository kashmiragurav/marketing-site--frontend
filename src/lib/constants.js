/**
 * Shared constants — import on both frontend and backend.
 * These values MUST match the Mongoose schema enum exactly.
 * Frontend filters read from CATEGORIES; backend schema uses CATEGORY_ENUM.
 */

export const CATEGORY_ENUM = [
  'Electronics',
  'Clothing',
  'Books',
  'Home',
  'Sports',
  'Beauty',
  'Toys',
  'Food',
]

// Frontend filter list — same values, same casing
export const CATEGORIES = CATEGORY_ENUM

// Sort options — value maps to backend sortBy/order logic
export const SORT_OPTIONS = [
  { value: 'createdAt',      label: 'Newest First' },
  { value: 'price_asc',      label: 'Price: Low → High' },
  { value: 'price_desc',     label: 'Price: High → Low' },
  { value: 'ratingsAverage', label: 'Top Rated' },
  { value: 'title',          label: 'Name A–Z' },
]

// Price range presets — min/max as strings for URL params
export const PRICE_RANGES = [
  { label: 'Under ₹500',       min: '',     max: '500'  },
  { label: '₹500 – ₹2,000',   min: '500',  max: '2000' },
  { label: '₹2,000 – ₹5,000', min: '2000', max: '5000' },
  { label: 'Over ₹5,000',      min: '5000', max: ''     },
]

// Low-stock threshold used consistently across frontend and backend
export const LOW_STOCK_THRESHOLD = 5
