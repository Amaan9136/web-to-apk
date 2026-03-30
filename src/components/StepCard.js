'use client'
import { motion } from 'framer-motion'

export default function StepCard({ number, title, description, icon: Icon, isLast }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: number * 0.1 }}
      className="relative flex flex-col items-center text-center"
    >
      <div className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4 ${!isLast ? 'step-line' : ''}`}>
        <Icon className="text-white text-2xl" />
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-primary-500 flex items-center justify-center">
          <span className="text-primary-600 text-xs font-bold">{number}</span>
        </div>
      </div>
      <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}
