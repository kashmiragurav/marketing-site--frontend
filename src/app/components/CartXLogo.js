export default function CartXLogo({ size = 'md', white = false }) {
  const sizes = { sm: '1.1rem', md: '1.4rem', lg: '1.875rem', xl: '2.25rem' }
  return (
    <span style={{ fontSize: sizes[size], fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, userSelect: 'none' }}>
      <span style={{ color: white ? '#e2e8f0' : 'var(--text-primary)' }}>Cart</span>
      <span style={{ color: 'var(--accent)' }}>X</span>
    </span>
  )
}
