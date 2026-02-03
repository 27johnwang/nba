import { useState, ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface CollapsibleProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  badge?: string | number
  className?: string
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  badge,
  className,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={clsx('border-t border-slate-700', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            {title}
          </span>
          {badge && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">
              {badge}
            </span>
          )}
        </div>
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  )
}
