import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { exec } from 'child_process'
import { promisify } from 'util'

const run = promisify(exec)
let ngrokUrl = null, ngrokQR = null, ngrokStarted = false, ngrokProc = null

async function killNgrok() {
  try {
    if (process.platform === 'win32') {
      await run('taskkill /F /IM ngrok.exe 2>nul || true')
      await run('ngrok tunnels kill-all || true')
    } else {
      await run('pkill -f ngrok || true')
    }
  } catch {}
  await new Promise(r => setTimeout(r, 1500))
}

async function startNgrok(apkName) {
  if (ngrokStarted && ngrokUrl) return { url: ngrokUrl, qr: ngrokQR, downloadUrl: `${ngrokUrl}/api/download-apk?name=${encodeURIComponent(apkName)}` }
  try {
    await killNgrok()
    const QRCode = await import('qrcode')
    const port = parseInt(process.env.PORT || '3000')

    await new Promise((resolve, reject) => {
      const env = { ...process.env }
      if (process.env.NGROK_AUTHTOKEN) env.NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN
      const args = ['http', String(port), '--log=stdout', '--log-format=json']
      ngrokProc = spawn('ngrok', args, {
        shell: true,
        windowsHide: true,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        env,
      })
      let resolved = false
      const timeout = setTimeout(() => { if (!resolved) reject(new Error('ngrok startup timeout')) }, 15000)
      const parseChunk = chunk => {
        for (const line of chunk.toString().split('\n').filter(Boolean)) {
          try {
            const parsed = JSON.parse(line)
            if (parsed.url && parsed.msg === 'started tunnel') {
              ngrokUrl = parsed.url
              resolved = true
              clearTimeout(timeout)
              resolve()
              return
            }
          } catch {
            const match = line.match(/url=(https?:\/\/[^\s]+)/)
            if (match) {
              ngrokUrl = match[1]
              resolved = true
              clearTimeout(timeout)
              resolve()
              return
            }
          }
        }
      }
      ngrokProc.stdout.on('data', parseChunk)
      ngrokProc.stderr.on('data', parseChunk)
      ngrokProc.on('error', err => { clearTimeout(timeout); reject(err) })
      ngrokProc.on('exit', code => { if (!resolved) { clearTimeout(timeout); reject(new Error(`ngrok exited with code ${code}`)) } })
    })

    if (!ngrokUrl) {
      await new Promise(r => setTimeout(r, 3000))
      try {
        const { stdout } = await run('curl -s http://127.0.0.1:4040/api/tunnels || true')
        const tunnels = JSON.parse(stdout || '{}')
        ngrokUrl = tunnels.tunnels?.find(t => t.proto === 'https')?.public_url || tunnels.tunnels?.[0]?.public_url || null
      } catch {}
    }

    if (!ngrokUrl) throw new Error('ngrok tunnel URL not found')
    const downloadUrl = `${ngrokUrl}/api/download-apk?name=${encodeURIComponent(apkName)}`
    ngrokQR = await QRCode.toDataURL(downloadUrl, { width: 200, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
    ngrokStarted = true
    return { url: ngrokUrl, qr: ngrokQR, downloadUrl }
  } catch (err) {
    console.error('ngrok error:', err)
    ngrokStarted = false; ngrokUrl = null; ngrokQR = null
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
    if (!result) return NextResponse.json({ success: false, message: 'ngrok failed to start. Make sure ngrok is installed and NGROK_AUTHTOKEN is set.' }, { status: 500 })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ active: ngrokStarted, url: ngrokUrl, qr: ngrokQR })
}