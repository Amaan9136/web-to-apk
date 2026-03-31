import { NextResponse } from 'next/server'

const isValidUrl = url => { try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } }
const sanitizeAppName = url => { try { return new URL(url).hostname.replace(/^www\./, '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) || 'WebApp' } catch { return 'WebApp' } }
const sanitizePkg = name => name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'webapp'

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; table[i] = c }
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function dosDateTime() {
  const d = new Date()
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2)
  return { date, time }
}

function writeUint16LE(v) { return Buffer.from([v & 0xFF, (v >> 8) & 0xFF]) }
function writeUint32LE(v) { return Buffer.from([v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >> 24) & 0xFF]) }

function zipEntry(name, data) {
  const nameBuf = Buffer.from(name, 'utf8')
  const dataBuf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')
  const crc = crc32(dataBuf)
  const { date, time } = dosDateTime()
  const local = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x03, 0x04]),
    writeUint16LE(20), writeUint16LE(0), writeUint16LE(0),
    writeUint16LE(time), writeUint16LE(date),
    writeUint32LE(crc), writeUint32LE(dataBuf.length), writeUint32LE(dataBuf.length),
    writeUint16LE(nameBuf.length), writeUint16LE(0),
    nameBuf, dataBuf
  ])
  const central = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x01, 0x02]),
    writeUint16LE(20), writeUint16LE(20), writeUint16LE(0), writeUint16LE(0),
    writeUint16LE(time), writeUint16LE(date),
    writeUint32LE(crc), writeUint32LE(dataBuf.length), writeUint32LE(dataBuf.length),
    writeUint16LE(nameBuf.length), writeUint16LE(0), writeUint16LE(0),
    writeUint16LE(0), writeUint16LE(0), writeUint32LE(0),
    writeUint32LE(0),
    nameBuf
  ])
  return { local, central, size: local.length }
}

function buildAPK(url, appName) {
  const pkg = sanitizePkg(appName)

  const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.webtoapp.${pkg}"
  android:versionCode="1"
  android:versionName="1.0">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE"/>
  <application
    android:label="${appName}"
    android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
    android:usesCleartextTraffic="true"
    android:hardwareAccelerated="true"
    android:networkSecurityConfig="@xml/network_security_config">
    <activity
      android:name=".MainActivity"
      android:exported="true"
      android:configChanges="orientation|screenSize|keyboardHidden"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
  </application>
</manifest>`

  const networkSecurity = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system"/>
      <certificates src="user"/>
    </trust-anchors>
  </base-config>
</network-security-config>`

  const mainActivity = `package com.webtoapp.${pkg};
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.view.Window;
import android.view.WindowManager;
public class MainActivity extends Activity {
  private WebView webView;
  @Override protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    requestWindowFeature(Window.FEATURE_NO_TITLE);
    getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
    webView = new WebView(this);
    setContentView(webView);
    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    s.setBuiltInZoomControls(false);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    webView.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, String u) { v.loadUrl(u); return true; }
    });
    webView.loadUrl("${url}");
  }
  @Override public void onBackPressed() { if (webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
}`

  const entries = []
  let offset = 0
  const files = [
    ['AndroidManifest.xml', manifest],
    ['res/xml/network_security_config.xml', networkSecurity],
    ['src/MainActivity.java', mainActivity],
    ['META-INF/MANIFEST.MF', `Manifest-Version: 1.0\nCreated-By: WebToAPK\nMain-Class: com.webtoapp.${pkg}.MainActivity\nApp-URL: ${url}\n`],
  ]

  const localParts = []
  const centralParts = []

  for (const [name, content] of files) {
    const entry = zipEntry(name, content)
    entry.central = Buffer.concat([entry.central.slice(0, 42), writeUint32LE(offset), entry.central.slice(46)])
    localParts.push(entry.local)
    centralParts.push(entry.central)
    offset += entry.local.length
  }

  const centralDir = Buffer.concat(centralParts)
  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x05, 0x06]),
    writeUint16LE(0), writeUint16LE(0),
    writeUint16LE(files.length), writeUint16LE(files.length),
    writeUint32LE(centralDir.length),
    writeUint32LE(offset),
    writeUint16LE(0)
  ])

  return Buffer.concat([...localParts, centralDir, eocd])
}

export async function POST(req) {
  try {
    const { url, appName: customName } = await req.json()
    if (!url || !isValidUrl(url)) return NextResponse.json({ success: false, message: 'Please provide a valid URL starting with http or https' }, { status: 400 })
    const appName = customName?.trim() || sanitizeAppName(url)
    const apkBuffer = buildAPK(url, appName)
    global.pendingApk = global.pendingApk || {}
    global.pendingApk[appName] = apkBuffer.toString('base64')
    return new NextResponse(apkBuffer, { status: 200, headers: { 'Content-Type': 'application/vnd.android.package-archive', 'Content-Disposition': `attachment; filename="${appName}.apk"`, 'Content-Length': apkBuffer.length.toString(), 'X-App-Name': appName, 'X-Source-URL': url } })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 })
  }
}