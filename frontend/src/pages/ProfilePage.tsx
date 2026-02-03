import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Clock, CheckCircle, XCircle, MinusCircle, ChevronRight, Settings, Star, History } from 'lucide-react'
import { profileApi, authApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/Card'
import { Pill, PillGroup } from '../components/Pill'
import { CardSkeleton, LoadingSpinner } from '../components/Loading'
import type { TrackedBet } from '../types'

export default function ProfilePage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const isAuthenticated = authApi.isAuthenticated()

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile-history', statusFilter],
    queryFn: () => profileApi.getHistory({ status: statusFilter }),
    enabled: isAuthenticated,
  })

  if (!isAuthenticated) {
    return <LoginPrompt />
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Profile</h1>

      {/* Summary card */}
      {isLoading ? (
        <CardSkeleton />
      ) : data ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">Tracked Bets</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{data.summary.total}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {data.summary.won}-{data.summary.lost}
                  {data.summary.push > 0 && `-${data.summary.push}`}
                </p>
                <p className="text-xs text-slate-400">W-L-P</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {data.summary.win_rate}%
                </p>
                <p className="text-xs text-slate-400">Win Rate</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Pending</span>
              <span className="text-yellow-400">{data.summary.pending} bets</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Status filter */}
      <PillGroup>
        <Pill
          active={statusFilter === undefined}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Pill>
        <Pill
          active={statusFilter === 'pending'}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </Pill>
        <Pill
          active={statusFilter === 'won'}
          onClick={() => setStatusFilter('won')}
        >
          Won
        </Pill>
        <Pill
          active={statusFilter === 'lost'}
          onClick={() => setStatusFilter('lost')}
        >
          Lost
        </Pill>
      </PillGroup>

      {/* Bets list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-slate-400">Unable to load history. Please try again.</p>
        </div>
      ) : data?.bets.length === 0 ? (
        <div className="text-center py-8">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No tracked bets yet.</p>
          <p className="text-slate-500 text-sm mt-1">
            Analyze lines and track your picks to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.bets.map((bet) => (
            <TrackedBetCard key={bet.id} bet={bet} />
          ))}
        </div>
      )}

      {/* Settings section */}
      <Card>
        <CardContent className="space-y-0 p-0">
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-750 transition-colors">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-slate-400" />
              <span className="text-white">Favorites</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
          <div className="border-t border-slate-700" />
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-750 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-400" />
              <span className="text-white">Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </CardContent>
      </Card>

      {/* Logout */}
      <button
        onClick={() => {
          authApi.logout()
          window.location.reload()
        }}
        className="w-full py-3 text-red-400 hover:text-red-300 transition-colors"
      >
        Log Out
      </button>
    </div>
  )
}

function TrackedBetCard({ bet }: { bet: TrackedBet }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    won: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    lost: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    push: { icon: MinusCircle, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  }

  const config = statusConfig[bet.status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-white">
                {bet.player?.name || bet.game.matchup}
              </p>
              <p className="text-sm text-slate-400">
                {bet.side.charAt(0).toUpperCase() + bet.side.slice(1)} {bet.line}{' '}
                {bet.prop || bet.market}
              </p>
            </div>
            <span className="text-xs text-slate-500">
              {bet.odds > 0 ? '+' : ''}{bet.odds}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>{bet.game.matchup}</span>
            <span>·</span>
            <span>{bet.game.date}</span>
          </div>
          {bet.actual_value !== null && bet.actual_value !== undefined && (
            <p className="text-sm mt-1 text-slate-300">
              Actual: {bet.actual_value} {bet.prop}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LoginPrompt() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await authApi.login(email, password)
      } else {
        await authApi.register(email, password)
        await authApi.login(email, password)
      }
      window.location.reload()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h1>
        <p className="text-slate-400 mt-1">
          {isLogin
            ? 'Sign in to track your bets'
            : 'Create an account to get started'}
        </p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white font-semibold transition-colors"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-slate-400">
        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-400 hover:text-blue-300"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}
