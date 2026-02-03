import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { analyzeApi, profileApi } from '../services/api'
import { Card, CardContent } from '../components/Card'
import { Pill, PillGroup } from '../components/Pill'
import { StatBox, StatRow } from '../components/StatBox'
import { Collapsible } from '../components/Collapsible'
import { LoadingSpinner } from '../components/Loading'
import { RiskFlag } from '../components/RiskFlag'
import type { AnalysisResponse } from '../types'

export default function AnalyzePage() {
  const { playerId, gameId, stat, line } = useParams()
  const navigate = useNavigate()
  const [window, setWindow] = useState<'L10' | 'L20' | 'Season'>('L10')
  const [side, setSide] = useState<'over' | 'under'>('over')

  const hasParams = playerId && gameId && stat && line

  const { data, isLoading, error } = useQuery({
    queryKey: ['analyze', playerId, gameId, stat, line, side],
    queryFn: () =>
      analyzeApi.analyze({
        player_id: Number(playerId),
        game_id: gameId!,
        stat: stat!,
        line: Number(line),
        side,
      }),
    enabled: !!hasParams,
  })

  const trackMutation = useMutation({
    mutationFn: () =>
      profileApi.trackBet({
        game_id: gameId!,
        player_id: Number(playerId),
        market_type: 'player_prop',
        prop_type: stat,
        line_value: Number(line),
        bet_side: side,
        odds: -110,
      }),
    onSuccess: () => {
      alert('Bet tracked successfully!')
    },
  })

  if (!hasParams) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">Select a line from the Lines tab to analyze</p>
        <button
          onClick={() => navigate('/lines')}
          className="px-4 py-2 bg-blue-600 rounded-lg text-white"
        >
          Browse Lines
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-slate-400 mt-4">Analyzing...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Analysis failed. Please try again.</p>
        <button
          onClick={() => navigate('/lines')}
          className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white"
        >
          Back to Lines
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-800">
          <Star className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Player & Line */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">{data.line.player.name}</h1>
        <p className="text-slate-400 capitalize">{data.line.stat}</p>
        <div className="mt-3 flex justify-center gap-2">
          <button
            onClick={() => setSide('over')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              side === 'over'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            Over {data.line.value}
          </button>
          <button
            onClick={() => setSide('under')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              side === 'under'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            Under {data.line.value}
          </button>
        </div>
      </div>

      {/* Essential Stats */}
      <Card>
        <CardContent>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
            Essential Stats
          </h2>

          {/* Window toggle */}
          <PillGroup className="mb-4">
            {(['L10', 'L20', 'Season'] as const).map((w) => (
              <Pill key={w} active={window === w} onClick={() => setWindow(w)}>
                {w}
              </Pill>
            ))}
          </PillGroup>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatBox
              label="L10 Average"
              value={data.essential.l10_average}
              subValue={`${data.line.stat}`}
            />
            <StatBox
              label="Season Average"
              value={data.essential.season_average}
              subValue={`${data.line.stat}`}
            />
            <StatBox
              label="Season Median"
              value={data.essential.season_median}
            />
            <StatBox
              label="Hit Rate (L10)"
              value={`${data.essential.hit_rate_l10.hits}/${data.essential.hit_rate_l10.total}`}
              subValue={`${data.essential.hit_rate_l10.percentage}%`}
              highlight={
                data.essential.hit_rate_l10.percentage >= 70
                  ? 'success'
                  : data.essential.hit_rate_l10.percentage >= 50
                  ? 'warning'
                  : 'danger'
              }
            />
          </div>

          <StatRow
            label="Hit Rate (Season)"
            value={`${data.essential.hit_rate_season.hits}/${data.essential.hit_rate_season.total} (${data.essential.hit_rate_season.percentage}%)`}
          />
        </CardContent>
      </Card>

      {/* Collapsible sections */}
      <Card>
        <CardContent className="p-0">
          {/* What Needs to Happen */}
          <Collapsible title="What Needs to Happen" defaultOpen>
            <div className="px-4">
              <p className="text-slate-300">{data.what_needs_to_happen}</p>
            </div>
          </Collapsible>

          {/* Recent vs Baseline */}
          <Collapsible title="Recent vs Baseline">
            <div className="px-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendIcon trend={data.recent_vs_baseline.trend} />
                <span className="text-white font-medium capitalize">
                  Trending {data.recent_vs_baseline.trend}
                </span>
                <span className="text-slate-400">
                  ({data.recent_vs_baseline.l10_vs_season > 0 ? '+' : ''}
                  {data.recent_vs_baseline.l10_vs_season} vs season)
                </span>
              </div>

              {/* Recent games mini chart */}
              <div className="flex items-end gap-1 h-12">
                {data.recent_vs_baseline.recent_games.slice(0, 10).map((value, idx) => {
                  const isOver = value > Number(line)
                  const height = Math.min(100, Math.max(20, (value / (Number(line) * 1.5)) * 100))
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-t transition-colors ${
                        isOver ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${value} ${data.line.stat}`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>10 games ago</span>
                <span>Most recent</span>
              </div>

              <p className="text-slate-300 mt-3">{data.recent_vs_baseline.summary}</p>
            </div>
          </Collapsible>

          {/* Matchup Context */}
          <Collapsible title="Matchup Context">
            <div className="px-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Opponent</span>
                <span className="text-white">{data.matchup.opponent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Opp Rank</span>
                <span className="text-white">{data.matchup.opponent_rank}</span>
              </div>
              {data.matchup.h2h_this_season && (
                <div className="flex justify-between">
                  <span className="text-slate-400">H2H This Season</span>
                  <span className="text-white">
                    {data.matchup.h2h_this_season.games} games,{' '}
                    {data.matchup.h2h_this_season.average?.toFixed(1) || 'N/A'} avg
                  </span>
                </div>
              )}
              {data.matchup.home_away_split && (
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {data.matchup.home_away_split.location.charAt(0).toUpperCase() +
                      data.matchup.home_away_split.location.slice(1)}{' '}
                    Split
                  </span>
                  <span className="text-white">
                    {data.matchup.home_away_split.average?.toFixed(1) || 'N/A'} avg (
                    {data.matchup.home_away_split.hit_rate_pct}% hit)
                  </span>
                </div>
              )}
              <p className="text-slate-300 mt-2">{data.matchup.summary}</p>
            </div>
          </Collapsible>

          {/* Volatility Flags */}
          <Collapsible
            title="Volatility Flags"
            badge={data.risk_flags.length || undefined}
          >
            <div className="px-4 space-y-2">
              {data.risk_flags.length === 0 ? (
                <p className="text-slate-400">No significant volatility flags identified.</p>
              ) : (
                data.risk_flags.map((flag, idx) => (
                  <RiskFlag key={idx} flag={flag} />
                ))
              )}
            </div>
          </Collapsible>

          {/* Bottom Line */}
          <Collapsible title="Bottom Line" defaultOpen>
            <div className="px-4">
              <p className="text-slate-300">{data.takeaway}</p>
            </div>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Track button */}
      <button
        onClick={() => trackMutation.mutate()}
        disabled={trackMutation.isPending}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-xl text-white font-semibold transition-colors"
      >
        {trackMutation.isPending ? 'Tracking...' : 'Track This Bet'}
      </button>
    </div>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') {
    return <TrendingUp className="w-5 h-5 text-green-400" />
  }
  if (trend === 'down') {
    return <TrendingDown className="w-5 h-5 text-red-400" />
  }
  return <Minus className="w-5 h-5 text-slate-400" />
}
