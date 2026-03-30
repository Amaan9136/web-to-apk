'use client'
import { motion } from 'framer-motion'
import { MdSignalCellularAlt, MdWifi, MdBattery80 } from 'react-icons/md'

export default function PhoneMockup({ url }) {
  const displayUrl = url || 'https://automatech.live'
  const hostname = (() => { try { return new URL(displayUrl).hostname } catch { return displayUrl } })()
  return (
    <motion.div initial={{ opacity: 0, y: 30, rotateY: -15 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} className="relative mx-auto" style={{ width: 280, perspective: 1000 }}>
      <div className="relative bg-slate-900 rounded-[40px] p-3 phone-shadow" style={{ width: 280, height: 560 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
        <div className="bg-white rounded-[32px] overflow-hidden h-full flex flex-col">
          <div className="bg-slate-900 px-4 pt-8 pb-2 flex items-center justify-between">
            <span className="text-white text-xs font-medium">9:41</span>
            <div className="flex items-center gap-1"><MdSignalCellularAlt className="text-white text-sm" /><MdWifi className="text-white text-sm" /><MdBattery80 className="text-white text-sm" /></div>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 flex items-center gap-2">
            <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-yellow-400" /><div className="w-2 h-2 rounded-full bg-green-400" /></div>
            <div className="flex-1 bg-slate-700 rounded-full px-2 py-0.5"><p className="text-slate-300 text-xs truncate">{hostname}</p></div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-sky-50 to-blue-100 flex flex-col items-center justify-center p-4 gap-3">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">{hostname.charAt(0).toUpperCase()}</span>
            </motion.div>
            <p className="text-slate-700 text-sm font-semibold text-center">{hostname}</p>
            <div className="w-full bg-white rounded-xl p-2 shadow-sm"><div className="h-2 bg-slate-200 rounded-full mb-1.5 w-3/4" /><div className="h-2 bg-slate-200 rounded-full mb-1.5" /><div className="h-2 bg-slate-200 rounded-full w-1/2" /></div>
            <div className="w-full bg-white rounded-xl p-2 shadow-sm"><div className="grid grid-cols-2 gap-1.5">{Array(4).fill(null).map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-lg" />)}</div></div>
          </div>
          <div className="bg-white border-t border-slate-100 px-6 py-2 flex justify-around">
            {Array(5).fill(null).map((_, i) => <div key={i} className={`w-5 h-5 rounded-md ${i === 2 ? 'bg-primary-500' : 'bg-slate-200'}`} />)}
          </div>
        </div>
        <div className="absolute right-0 top-20 w-1 h-12 bg-slate-700 rounded-l-full" />
        <div className="absolute left-0 top-16 w-1 h-8 bg-slate-700 rounded-r-full" />
        <div className="absolute left-0 top-28 w-1 h-8 bg-slate-700 rounded-r-full" />
      </div>
    </motion.div>
  )
}