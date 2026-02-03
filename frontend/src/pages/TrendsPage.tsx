import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Flame, Snowflake, Target, ChevronRight } from 'lucide-react'
import { trendsApi } from '../services/api'
import { Card, CardContent } from '../components/Card'
import { Pill, PillGroup } from '../components/Pill'
import { CardSkeleton } from '../components/Loading'
import type { Trend } from '../types'

const TREND_TYPES = [
  { value: 'hot', label: 'Hot Streaks', icon: Flame, color: 'text-orange-400' },
  { value: 'cold', label: 'Cold Streaks', icon: Snowflake, color: 'text-blue-400' },
  { value: 'consistent', label: 'Consistent', icon: Target, color: 'text-green-400' },
]

export default function TrendsPage() {
  const navigate = useNavigate()
  const [trendType, setTrendType] = useState('hot')

  const { data, isLoading, error } = useQuery({
    queryKey: ['trends', trendType],
    queryFn: () => trendsApi.getTrends({ type: trendType }),
  })

  const currentType = TREND_TYPES.find((t) => t.value === trendType)
  const Icon = currentType?.icon || Flame

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Trends</h1>

      {/* Type filter */}
      <PillGroup>
        {TREND_TYPES.map((type) => (
          <Pill
            key={type.value}
            active={trendType === type.value}
            onClick={() => setTrendType(type.value)}
          >
            <span className="flex items-center gap-1.5">
              <type.icon className={`w-4 h-4 ${type.color}`} />
              {type.label}
            </span>
          </Pill>
        ))}
      </PillGroup>

      {/* Trends list */}
      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-slate-400">Unable to load trends. Please try again.</p>
        </div>
      ) : data?.trends.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No trends found for this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Section header */}
          <div className="flex items-center gap-2 text-slate-400">
            <Icon className={`w-5 h-5 ${currentType?.color}`} />
            <span className="text-sm uppercase tracking-wide font-medium">
              {currentType?.label} (Last 10 Games)
            </span>
          </div>

          {data?.trends.map((trend) => (
            <TrendCard
              key={`${trend.player.id}-${trend.stat}`}
              trend={trend}
              type={trendType}
              onClick={() => {
                // Navigate to analyze page with this player's line
                // For now, we'll use a placeholder game_id
                navigate(`/analyze/${trend.player.id}/0022400385/${trend.stat}/${trend.reference_line}`)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface TrendCardProps {
  trend: Trend
  type: string
  onClick: () => void
}

function TrendCard({ trend, type, onClick }: TrendCardProps) {
  const hitRateColor =
    trend.hit_rate.percentage >= 70
      ? 'text-green-400'
      : trend.hit_rate.percentage <= 30
      ? 'text-red-400'
      : 'text-yellow-400'

  return (
    <Card hoverable onClick={onClick}>
      <CardContent className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{trend.player.name}</h3>
            <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">
              {trend.player.team}
            </span>
          </div>
          <p className="text-sm text-slate-400 capitalize mt-0.5">{trend.stat}</p>

          <div className="mt-2 flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">Hit Rate</p>
              <p className={`font-semibold ${hitRateColor}`}>
                {trend.hit_rate.hits}/{trend.hit_rate.total} (
                {trend.hit_rate.percentage}%)
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">L10 Avg</p>
              <p className="font-semibold text-white">{trend.l10_average}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Season</p>
              <p className="font-semibold text-slate-400">{trend.season_average}</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Line: {trend.reference_line} {trend.stat}
          </p>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-500" />
      </CardContent>
    </Card>
  )
}
