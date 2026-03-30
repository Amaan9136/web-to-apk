import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'WebToAPK — Convert Any Website to Android App',
  description: 'Paste a URL and download a ready-to-install APK in seconds. Convert any website to a full-screen React Native Android application.',
  keywords: 'website to apk, convert website android app, url to apk, webview apk generator',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', background: '#1e293b', color: '#f1f5f9', fontSize: '14px' }, success: { iconTheme: { primary: '#0ea5e9', secondary: '#f1f5f9' } } }} />
      </body>
    </html>
  )
}
