'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { MdClose, MdQrCode2, MdLink, MdContentCopy, MdCheckCircle, MdPhoneAndroid } from 'react-icons/md'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function NgrokModal({ isOpen, onClose, ngrokData, apkName }) {
  const [copied, setCopied] = useState(false)
  const copyUrl = () => { navigator.clipboard.writeText(ngrokData?.downloadUrl); setCopied(true); toast.success('URL copied!'); setTimeout(() => setCopied(false), 2000) }
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', bounce: 0.3 }} className="glass rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center"><MdQrCode2 className="text-white text-lg" /></div>
                <div><h3 className="font-bold text-slate-800 text-sm">Scan to Download</h3><p className="text-slate-400 text-xs">Temporary ngrok link</p></div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"><MdClose className="text-slate-600" /></button>
            </div>
            <div className="flex justify-center mb-4">
              {ngrokData?.qr ? <div className="qr-container shadow-lg"><Image src={ngrokData.qr} alt="QR Code" width={180} height={180} /></div> : <div className="w-[180px] h-[180px] bg-slate-100 rounded-xl flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}
            </div>
            <div className="text-center mb-4">
              <div className="flex items-center gap-1 justify-center mb-1"><MdPhoneAndroid className="text-primary-500 text-sm" /><span className="text-slate-800 text-sm font-semibold">{apkName}.apk</span></div>
              <p className="text-slate-800 text-xs">Scan the QR code with your Android phone to download</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1"><MdLink className="text-primary-500" />Direct link</p>
              <p className="text-xs text-slate-800 font-mono break-all leading-relaxed">{ngrokData?.downloadUrl}</p>
            </div>
            <button onClick={copyUrl} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg transition-all">
              {copied ? <><MdCheckCircle className="text-lg" />Copied!</> : <><MdContentCopy className="text-lg" />Copy Download Link</>}
            </button>
            <p className="text-center text-xs text-slate-800 mt-3">Temporary - expires when server restarts</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}