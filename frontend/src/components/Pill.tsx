import clsx from 'clsx'

interface PillProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}

export function Pill({ children, active = false, onClick, className }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
        active
          ? 'bg-blue-600 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
        className
      )}
    >
      {children}
    </button>
  )
}

interface PillGroupProps {
  children: React.ReactNode
  className?: string
}

export function PillGroup({ children, className }: PillGroupProps) {
  return (
    <div className={clsx('flex gap-2 overflow-x-auto pb-2 -mx-4 px-4', className)}>
      {children}
    </div>
  )
}
