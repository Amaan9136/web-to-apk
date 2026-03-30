'use client'
import { motion } from 'framer-motion'

export default function FeatureChip({ icon: Icon, label }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200 shadow-sm text-sm text-slate-700"
    >
      <Icon className="text-primary-500 text-base" />
      <span>{label}</span>
    </motion.div>
  )
}