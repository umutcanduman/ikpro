import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/auth/AuthProvider'

export const metadata: Metadata = {
  title: 'İKPro — Turkey\'s Next-Gen HR Platform',
  description: 'The all-in-one, modular HR platform built for Turkish businesses. From hire to retire.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                borderRadius: '12px',
                border: '1px solid #EBEBF0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
