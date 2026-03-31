import { Toaster } from 'react-hot-toast'
import Script from 'next/script'
import './globals.css'

export const metadata = {
  title: 'WebToAPK - Convert Any Website to Android App',
  description: 'Convert any website URL into a downloadable Android APK instantly. Free, fast, no signup required.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'WebToAPK' },
}

export const viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WebToAPK" />
        <Script id="sw-register" strategy="afterInteractive">{`if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`}</Script>
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#f1f5f9', borderRadius: '12px', fontSize: '14px' } }} />
      </body>
    </html>
  )
}