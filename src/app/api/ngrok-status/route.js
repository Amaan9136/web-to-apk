import { NextResponse } from 'next/server'

let ngrokUrl = null
let ngrokQR = null
let ngrokStarted = false
let ngrokListener = null

async function startNgrok(apkName) {
  if (ngrokStarted && ngrokUrl) return { url: ngrokUrl, qr: ngrokQR, downloadUrl: `${ngrokUrl}/api/download-apk?name=${encodeURIComponent(apkName)}` }
  try {
    const ngrok = await import('@ngrok/ngrok')
    const QRCode = await import('qrcode')
    const port = parseInt(process.env.PORT || '3000')
    ngrokListener = await ngrok.forward({ addr: port, authtoken_from_env: true })
    ngrokUrl = ngrokListener.url()
    const downloadUrl = `${ngrokUrl}/api/download-apk?name=${encodeURIComponent(apkName)}`
    ngrokQR = await QRCode.toDataURL(downloadUrl, { width: 200, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
    ngrokStarted = true
    return { url: ngrokUrl, qr: ngrokQR, downloadUrl }
  } catch (err) {
    console.error('ngrok error:', err)
    return null
  }
}

export async function POST(req) {
  try {
    const { apkName, apkData } = await req.json()
    if (!apkName) return NextResponse.json({ success: false, message: 'apkName required' }, { status: 400 })

    global.pendingApk = global.pendingApk || {}
    if (apkData) global.pendingApk[apkName] = apkData

    const result = await startNgrok(apkName)
    if (!result) return NextResponse.json({ success: false, message: 'ngrok not available — set NGROK_AUTHTOKEN env variable' }, { status: 500 })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ active: ngrokStarted, url: ngrokUrl, qr: ngrokQR })
}