'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../app/components/api'

const CartContext = createContext({ count: 0, refresh: () => {} })

export function CartProvider({ children }) {
  const [count, setCount] = useState(0)

  // Call refresh() explicitly after login or cart mutations.
  // Do NOT auto-fetch on mount — avoids 401 for unauthenticated users.
  const refresh = useCallback(async () => {
    try {
      const { ok, data } = await api.getCart()
      if (ok) {
        const items = Array.isArray(data) ? data : (data.items || [])
        setCount(items.reduce((s, i) => s + (i.quantity || 1), 0))
      } else {
        setCount(0)
      }
    } catch {
      setCount(0)
    }
  }, [])

  const reset = () => setCount(0)

  return (
    <CartContext.Provider value={{ count, refresh, reset }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
