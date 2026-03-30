'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { MdAndroid, MdArrowForward, MdCheckCircle, MdDownload, MdRefresh, MdLink, MdSmartphone, MdAutoAwesome, MdSecurity, MdSpeed, MdPhoneAndroid, MdQrCode2, MdShare } from 'react-icons/md'
import PhoneMockup from '@/components/PhoneMockup'
import FeatureChip from '@/components/FeatureChip'
import StepCard from '@/components/StepCard'
import NgrokModal from '@/components/NgrokModal'

const FEATURES = [{ icon: MdSpeed, label: 'Instant Generation' }, { icon: MdSecurity, label: 'Secure & Private' }, { icon: MdPhoneAndroid, label: 'Full Screen App' }, { icon: MdAndroid, label: 'Android APK' }]
const STEPS = [{ title: 'Paste URL', description: 'Enter any website URL like https://automatech.live', icon: MdLink }, { title: 'Convert', description: 'Click Convert to APK and wait a few seconds while we build your app', icon: MdAndroid }, { title: 'Download', description: 'Download your APK or scan the QR code on your phone', icon: MdDownload }]
const isValidUrl = url => { try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } }

export default function Home() {
  const [url, setUrl] = useState('')
  const [appName, setAppName] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [downloadInfo, setDownloadInfo] = useState(null)
  const [ngrokLoading, setNgrokLoading] = useState(false)
  const [ngrokData, setNgrokData] = useState(null)
  const [showNgrok, setShowNgrok] = useState(false)
  const inputRef = useRef(null)
  const progressRef = useRef(null)

  const simulateProgress = () => {
    setProgress(0)
    let p = 0
    const steps = [{ target: 20, speed: 80 }, { target: 55, speed: 120 }, { target: 80, speed: 200 }, { target: 95, speed: 400 }]
    let stepIdx = 0
    const tick = () => {
      if (stepIdx >= steps.length) return
      const { target, speed } = steps[stepIdx]
      if (p < target) { p = Math.min(p + 1, target); setProgress(p); progressRef.current = setTimeout(tick, speed) }
      else { stepIdx++; progressRef.current = setTimeout(tick, 200) }
    }
    progressRef.current = setTimeout(tick, 50)
  }

  const handleConvert = async () => {
    if (!url.trim()) { toast.error('Please enter a website URL'); inputRef.current?.focus(); return }
    if (!isValidUrl(url.trim())) { toast.error('Please enter a valid URL e.g. https://example.com'); return }
    setLoading(true); setDone(false); setDownloadInfo(null); setNgrokData(null)
    simulateProgress()
    try {
      const res = await fetch('/api/generate-apk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim(), appName: appName.trim() }) })
      clearTimeout(progressRef.current); setProgress(100)
      if (!res.ok) { const err = await res.json().catch(() => ({ message: 'Unknown error' })); throw new Error(err.message || 'APK generation failed') }
      const blob = await res.blob()
      const name = res.headers.get('X-App-Name') || 'WebApp'
      const objectUrl = URL.createObjectURL(blob)
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1]
        try { await fetch('/api/ngrok-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apkName: name, apkData: base64 }) }) } catch {}
      }
      setDownloadInfo({ objectUrl, name, size: (blob.size / 1024).toFixed(1) }); setDone(true)
      toast.success(`APK ready!`)
      const a = document.createElement('a'); a.href = objectUrl; a.download = `${name}.apk`; a.click()
    } catch (err) {
      clearTimeout(progressRef.current); setProgress(0)
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const handleNgrok = async () => {
    if (!downloadInfo) return
    setNgrokLoading(true)
    try {
      const res = await fetch('/api/ngrok-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apkName: downloadInfo.name }) })
      const data = await res.json()
      if (data.success) { setNgrokData(data); setShowNgrok(true) }
      else toast.error(data.message || 'ngrok unavailable. Set NGROK_AUTHTOKEN env variable.')
    } catch { toast.error('Failed to start ngrok tunnel') }
    finally { setNgrokLoading(false) }
  }

  const handleReset = () => {
    if (downloadInfo?.objectUrl) URL.revokeObjectURL(downloadInfo.objectUrl)
    setUrl(''); setAppName(''); setDone(false); setDownloadInfo(null); setProgress(0); setNgrokData(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleKeyDown = e => { if (e.key === 'Enter' && !loading) handleConvert() }

  return (
    <div className="min-h-screen">
      <NgrokModal isOpen={showNgrok} onClose={() => setShowNgrok(false)} ngrokData={ngrokData} apkName={downloadInfo?.name} />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-300/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 w-full max-w-xl">
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold uppercase tracking-wider"><MdAutoAwesome className="text-sm" />Free · Instant · No signup</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                Turn Any Website Into an <span className="bg-gradient-to-r from-primary-500 to-violet-500 bg-clip-text text-transparent">Android App</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-slate-600 text-lg mb-8 leading-relaxed">Paste a URL and get a full-screen native-feel Android APK in seconds.</motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 shadow-xl shadow-slate-200/50 mb-6">
                <AnimatePresence mode="wait">
                  {!done ? (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Website URL</label>
                        <div className="relative">
                          <MdLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                          <input ref={inputRef} type="url" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={handleKeyDown} placeholder="https://automatech.live" disabled={loading} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">App Name <span className="text-slate-400 font-normal">(optional)</span></label>
                        <div className="relative">
                          <MdSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                          <input type="text" value={appName} onChange={e => setAppName(e.target.value)} onKeyDown={handleKeyDown} placeholder="MyApp" disabled={loading} maxLength={30} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 text-sm" />
                        </div>
                      </div>
                      {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-500"><span>Building your APK…</span><span>{progress}%</span></div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full" style={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                          </div>
                          <div className="flex gap-2 text-xs text-slate-400 flex-wrap">
                            {['Parsing URL', 'Generating manifest', 'Bundling assets', 'Compiling APK…'].map((step, i) => (
                              <span key={step} className={`flex items-center gap-0.5 ${progress > (i + 1) * 25 ? 'text-primary-600' : ''}`}>{progress > (i + 1) * 25 && <MdCheckCircle className="text-xs" />}{step}</span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      <motion.button whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }} onClick={handleConvert} disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                        {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Converting…</> : <><MdAndroid className="text-xl" />Convert to APK<MdArrowForward className="text-lg" /></>}
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-4">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-400/30">
                        <MdCheckCircle className="text-white text-4xl" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">APK Ready!</h3>
                        <p className="text-slate-500 text-sm"><strong>{downloadInfo?.name}.apk</strong> · {downloadInfo?.size} KB - download started automatically</p>
                      </div>
                      <div className="flex gap-3">
                        <a href={downloadInfo?.objectUrl} download={`${downloadInfo?.name}.apk`} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-sm"><MdDownload className="text-xl" />Download Again</a>
                        <button onClick={handleReset} className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5 text-sm"><MdRefresh className="text-lg" />New</button>
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-500 mb-3">Want to download on your phone?</p>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNgrok} disabled={ngrokLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-70">
                          {ngrokLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating QR…</> : <><MdQrCode2 className="text-xl" />Get QR Code &amp; Share Link<MdShare className="text-lg" /></>}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-2">
                {FEATURES.map(f => <FeatureChip key={f.label} {...f} />)}
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="flex-shrink-0 hidden lg:block">
              <PhoneMockup url={url} />
            </motion.div>
          </div>
        </div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">How It Works</h2>
          <p className="text-slate-500">Three simple steps to your Android app</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => <StepCard key={step.title} number={i + 1} {...step} isLast={i === STEPS.length - 1} />)}
        </div>
      </div>
      <div className="relative z-10 py-8 border-t border-slate-200/50">
        <p className="text-center text-slate-400 text-sm">Built with ❤️ by <a href="https://automatech.live" target="_blank" rel="noreferrer" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">Automatech</a></p>
      </div>
    </div>
  )
}