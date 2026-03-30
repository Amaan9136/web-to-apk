import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const run = promisify(exec)
let ngrokUrl = null, ngrokQR = null, ngrokStarted = false

async function startNgrok(apkName) {
  if (ngrokStarted && ngrokUrl) return { url: ngrokUrl, qr: ngrokQR, downloadUrl: `${ngrokUrl}/api/download-apk?name=${encodeURIComponent(apkName)}` }
  try {
    try { await run('taskkill /F /IM ngrok.exe', { windowsHide: true }) } catch {}
    await new Promise(r => setTimeout(r, 1000))
    const QRCode = await import('qrcode')
    const port = parseInt(process.env.PORT || '3000')
    const cmd = process.platform === 'win32' ? `start /B "" ngrok http ${port} --log=stdout --pooling-enabled=true` : `ngrok http ${port} --log=stdout --pooling-enabled=true &`
    await run(cmd, { windowsHide: true })
    await new Promise(r => setTimeout(r, 3000))
    const { stdout } = await run('curl http://127.0.0.1:4040/api/tunnels', { windowsHide: true })
    const data = JSON.parse(stdout)
    ngrokUrl = data.tunnels?.find(t => t.proto === 'https')?.public_url || data.tunnels?.[0]?.public_url || null
    if (!ngrokUrl) throw new Error('ngrok tunnel not created')
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
    if (!result) return NextResponse.json({ success: false, message: 'ngrok not available — install ngrok CLI and set auth token' }, { status: 500 })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ active: ngrokStarted, url: ngrokUrl, qr: ngrokQR })
}