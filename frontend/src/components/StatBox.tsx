import clsx from 'clsx'

interface StatBoxProps {
  label: string
  value: string | number
  subValue?: string
  highlight?: 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

export function StatBox({ label, value, subValue, highlight, className }: StatBoxProps) {
  return (
    <div className={clsx('bg-slate-750 rounded-lg p-3', className)}>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p
        className={clsx(
          'text-xl font-bold',
          highlight === 'success' && 'text-green-400',
          highlight === 'warning' && 'text-yellow-400',
          highlight === 'danger' && 'text-red-400',
          !highlight && 'text-white'
        )}
      >
        {value}
      </p>
      {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
    </div>
  )
}

interface StatRowProps {
  label: string
  value: string | number
  className?: string
}

export function StatRow({ label, value, className }: StatRowProps) {
  return (
    <div className={clsx('flex justify-between items-center py-2', className)}>
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}
