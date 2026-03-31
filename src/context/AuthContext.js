'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../app/components/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(false) // prevents double-fetch in React StrictMode

  const fetchUser = useCallback(async () => {
    try {
      const { ok, data } = await api.me()
      if (ok && data?.email) {
        setUser({ ...data })
        return true
      }
    } catch {}
    setUser(null)
    return false
  }, [])

  useEffect(() => {
    // Guard: only run once per actual mount (not StrictMode double-invoke)
    if (mountedRef.current) return
    mountedRef.current = true
    fetchUser().finally(() => setLoading(false))
  }, [fetchUser])

  const refresh = useCallback(async () => {
    const ok = await fetchUser()
    setLoading(false)
    return ok
  }, [fetchUser])

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
