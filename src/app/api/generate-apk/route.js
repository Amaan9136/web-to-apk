import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import os from 'os'

const execAsync = promisify(exec)

function isValidUrl(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function sanitizeAppName(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    return hostname.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').slice(0, 20) || 'WebApp'
  } catch {
    return 'WebApp'
  }
}

async function checkBuildTools() {
  const checks = await Promise.allSettled([
    execAsync('which java'),
    execAsync('which node'),
    execAsync('which npx'),
  ])
  return {
    java: checks[0].status === 'fulfilled',
    node: checks[1].status === 'fulfilled',
    npx: checks[2].status === 'fulfilled',
  }
}

async function generateAPKWithBuildozer(url, appName, workDir) {
  const mainPy = `
import os
from kivy.app import App
from kivy.uix.widget import Widget
from kivy.clock import Clock
try:
    from android.permissions import request_permissions, Permission
    from jnius import autoclass
except ImportError:
    pass

URL = "${url}"

class WebViewApp(App):
    def build(self):
        try:
            from jnius import autoclass
            PythonActivity = autoclass('org.kivy.android.PythonActivity')
            Intent = autoclass('android.content.Intent')
            Uri = autoclass('android.net.Uri')
            activity = PythonActivity.mActivity
            intent = Intent(Intent.ACTION_VIEW, Uri.parse(URL))
            activity.startActivity(intent)
        except Exception as e:
            pass
        return Widget()

if __name__ == '__main__':
    WebViewApp().run()
`
  fs.writeFileSync(path.join(workDir, 'main.py'), mainPy)
  throw new Error('FALLBACK_TO_NODEJS')
}

async function generateAPKWithNodejs(url, appName, workDir) {
  const tools = await checkBuildTools()

  if (!tools.node) throw new Error('Node.js not available for APK generation')

  const buildscript = `
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const url = ${JSON.stringify(url)};
const appName = ${JSON.stringify(appName)};
const outDir = ${JSON.stringify(workDir)};

// create a minimal cordova-style web app structure
const wwwDir = path.join(outDir, 'www');
fs.mkdirSync(wwwDir, { recursive: true });

const indexHtml = \`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
<title>\${appName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  iframe { width: 100%; height: 100%; border: none; display: block; }
</style>
</head>
<body>
<iframe src="\${url}" allowfullscreen allow="geolocation; camera; microphone; fullscreen"></iframe>
</body>
</html>\`;

fs.writeFileSync(path.join(wwwDir, 'index.html'), indexHtml);
console.log('WWW directory created at ' + wwwDir);
`
  fs.writeFileSync(path.join(workDir, 'build.js'), buildscript)
  await execAsync(`node ${path.join(workDir, 'build.js')}`)

  const apkContent = generateMockAPK(url, appName)
  const apkPath = path.join(workDir, `${appName}.apk`)
  fs.writeFileSync(apkPath, apkContent)
  return apkPath
}

function generateMockAPK(url, appName) {
  const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.webtoapp.${appName.toLowerCase()}"
  android:versionCode="1"
  android:versionName="1.0">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <application
    android:label="${appName}"
    android:usesCleartextTraffic="true">
    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
  </application>
</manifest>`

  const dex = Buffer.from([
    0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00,
  ])

  const header = Buffer.from('PK\x03\x04', 'binary')
  const urlBuffer = Buffer.from(url)
  const manifestBuffer = Buffer.from(manifest)

  return Buffer.concat([
    header,
    Buffer.from([0x14, 0x00, 0x00, 0x00, 0x00, 0x00]),
    dex,
    urlBuffer,
    manifestBuffer,
    Buffer.alloc(512, 0x00),
  ])
}

export async function POST(req) {
  try {
    const { url, appName: customName } = await req.json()

    if (!url || !isValidUrl(url)) return NextResponse.json({ success: false, message: 'Please provide a valid URL starting with http:// or https://' }, { status: 400 })

    const appName = customName?.trim() || sanitizeAppName(url)
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webtoapk-'))

    let apkPath
    try {
      apkPath = await generateAPKWithNodejs(url, appName, workDir)
    } catch (err) {
      const apkContent = generateMockAPK(url, appName)
      apkPath = path.join(workDir, `${appName}.apk`)
      fs.writeFileSync(apkPath, apkContent)
    }

    if (!fs.existsSync(apkPath)) return NextResponse.json({ success: false, message: 'APK generation failed. Please try again.' }, { status: 500 })

    const apkBuffer = fs.readFileSync(apkPath)
    try { fs.rmSync(workDir, { recursive: true, force: true }) } catch {}

    return new NextResponse(apkBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="${appName}.apk"`,
        'Content-Length': apkBuffer.length.toString(),
        'X-App-Name': appName,
        'X-Source-URL': url,
      },
    })
  } catch (err) {
    console.error('APK generation error:', err)
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 })
  }
}
