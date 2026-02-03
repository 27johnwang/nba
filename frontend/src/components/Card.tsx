import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export function Card({ children, className, onClick, hoverable = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-slate-800 rounded-xl border border-slate-700',
        hoverable && 'hover:bg-slate-750 hover:border-slate-600 transition-colors cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('px-4 py-3 border-b border-slate-700', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('p-4', className)}>{children}</div>
}
