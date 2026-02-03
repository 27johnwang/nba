import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import clsx from 'clsx'
import type { RiskFlag as RiskFlagType } from '../types'

interface RiskFlagProps {
  flag: RiskFlagType
  className?: string
}

export function RiskFlag({ flag, className }: RiskFlagProps) {
  const severityConfig = {
    high: {
      icon: AlertTriangle,
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      iconColor: 'text-red-400',
    },
    medium: {
      icon: AlertCircle,
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      iconColor: 'text-yellow-400',
    },
    low: {
      icon: Info,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      iconColor: 'text-blue-400',
    },
  }

  const config = severityConfig[flag.severity]
  const Icon = config.icon

  const typeLabels: Record<string, string> = {
    minutes_volatility: 'Minutes Volatility',
    blowout_risk: 'Blowout Risk',
    role_change: 'Role Change',
    back_to_back: 'Back-to-Back',
    teammate_injury: 'Teammate Injury',
    cold_streak: 'Cold Streak',
    hot_streak: 'Hot Streak',
  }

  return (
    <div
      className={clsx(
        'rounded-lg border p-3',
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', config.iconColor)} />
        <div>
          <p className={clsx('text-sm font-medium', config.text)}>
            {typeLabels[flag.type] || flag.type}
          </p>
          <p className="text-sm text-slate-300 mt-0.5">{flag.description}</p>
        </div>
      </div>
    </div>
  )
}
