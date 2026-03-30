import { NextResponse } from 'next/server'

export async function GET(req) {
  const name = new URL(req.url).searchParams.get('name') || 'WebApp'
  global.pendingApk = global.pendingApk || {}
  const apkData = global.pendingApk[name]
  if (!apkData) return NextResponse.json({ error: 'APK not found. Generate it first.' }, { status: 404 })
  const buffer = Buffer.from(apkData, 'base64')
  return new NextResponse(buffer, { status: 200, headers: { 'Content-Type': 'application/vnd.android.package-archive', 'Content-Disposition': `attachment; filename="${name}.apk"`, 'Content-Length': buffer.length.toString() } })
}