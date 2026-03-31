import './globals.css'
import { ThemeProvider } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'CartX — Seller Dashboard',
  description: 'Professional seller dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {/*
                Toaster uses fixed dark style so it's always readable
                regardless of page theme (toasts appear over any bg)
              */}
              <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                  duration: 2500,
                  style: {
                    background: '#1e293b',
                    color: '#f1f5f9',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    padding: '10px 14px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    maxWidth: '300px',
                  },
                  success: {
                    duration: 2000,
                    iconTheme: { primary: '#4ade80', secondary: '#052e16' },
                  },
                  error: {
                    duration: 3500,
                    iconTheme: { primary: '#f87171', secondary: '#3b0a0a' },
                  },
                }}
              />
              {children}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
