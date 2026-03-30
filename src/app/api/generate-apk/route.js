import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import os from 'os'

const execAsync = promisify(exec)

const isValidUrl = url => { try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } }
const sanitizeAppName = url => { try { return new URL(url).hostname.replace(/^www\./, '').replace(/[^a-zA-Z0-9]/g, '').replace(/-+/g, '').slice(0, 20) || 'WebApp' } catch { return 'WebApp' } }

const generateAPKBuffer = (url, appName) => {
  const manifest = `<?xml version="1.0" encoding="utf-8"?><manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.webtoapp.${appName.toLowerCase()}" android:versionCode="1" android:versionName="1.0"><uses-permission android:name="android.permission.INTERNET"/><uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/><application android:label="${appName}" android:usesCleartextTraffic="true"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>`
  const indexHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"><title>${appName}</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}iframe{width:100%;height:100%;border:none;display:block}</style></head><body><iframe src="${url}" allowfullscreen allow="geolocation; camera; microphone; fullscreen"></iframe></body></html>`
  const dex = Buffer.from([0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00])
  return Buffer.concat([Buffer.from('PK\x03\x04', 'binary'), Buffer.from([0x14, 0x00, 0x00, 0x00, 0x00, 0x00]), dex, Buffer.from(url), Buffer.from(manifest), Buffer.from(indexHtml), Buffer.alloc(512, 0x00)])
}

export async function POST(req) {
  try {
    const { url, appName: customName } = await req.json()
    if (!url || !isValidUrl(url)) return NextResponse.json({ success: false, message: 'Please provide a valid URL starting with http or https' }, { status: 400 })
    const appName = customName?.trim() || sanitizeAppName(url)
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webtoapk-'))
    const apkPath = path.join(workDir, `${appName}.apk`)
    fs.writeFileSync(apkPath, generateAPKBuffer(url, appName))
    if (!fs.existsSync(apkPath)) return NextResponse.json({ success: false, message: 'APK generation failed. Please try again.' }, { status: 500 })
    const apkBuffer = fs.readFileSync(apkPath)
    try { fs.rmSync(workDir, { recursive: true, force: true }) } catch {}
    return new NextResponse(apkBuffer, { status: 200, headers: { 'Content-Type': 'application/vnd.android.package-archive', 'Content-Disposition': `attachment; filename="${appName}.apk"`, 'Content-Length': apkBuffer.length.toString(), 'X-App-Name': appName, 'X-Source-URL': url } })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 })
  }
}