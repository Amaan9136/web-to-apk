import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata = {
  title: 'WebToAPK — Convert Any Website to Android App',
  description: 'Convert any website URL into a downloadable Android APK instantly. Free, fast, no signup required.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#f1f5f9', borderRadius: '12px', fontSize: '14px' } }} />
      </body>
    </html>
  )
}