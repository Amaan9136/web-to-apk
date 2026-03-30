import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name') || 'WebApp'

  global._pendingApk = global._pendingApk || {}
  const apkData = global._pendingApk[name]

  if (!apkData) return NextResponse.json({ error: 'APK not found. Generate it first.' }, { status: 404 })

  const buffer = Buffer.from(apkData, 'base64')
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="${name}.apk"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}
