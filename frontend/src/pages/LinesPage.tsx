import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { linesApi } from '../services/api'
import { Card, CardHeader, CardContent } from '../components/Card'
import { Pill, PillGroup } from '../components/Pill'
import { CardSkeleton } from '../components/Loading'
import type { Game, PlayerProps, PropLine } from '../types'

const MARKET_FILTERS = [
  { value: '', label: 'All' },
  { value: 'player_prop', label: 'Props' },
  { value: 'spread', label: 'Spreads' },
  { value: 'total', label: 'Totals' },
]

const BOOK_OPTIONS = [
  { value: '', label: 'All Books' },
  { value: 'draftkings', label: 'DraftKings' },
  { value: 'fanduel', label: 'FanDuel' },
]

export default function LinesPage() {
  const navigate = useNavigate()
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [marketFilter, setMarketFilter] = useState('')
  const [bookFilter, setBookFilter] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['lines', dateFilter, marketFilter, bookFilter],
    queryFn: () =>
      linesApi.getLines({
        date: dateFilter,
        market: marketFilter || undefined,
        book: bookFilter || undefined,
      }),
  })

  const handleLineClick = (
    playerId: number,
    gameId: string,
    stat: string,
    line: number
  ) => {
    navigate(`/analyze/${playerId}/${gameId}/${stat}/${line}`)
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Unable to load lines. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-white font-medium">
            {format(new Date(dateFilter), 'MMM d')}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Market filter pills */}
      <PillGroup>
        {MARKET_FILTERS.map((filter) => (
          <Pill
            key={filter.value}
            active={marketFilter === filter.value}
            onClick={() => setMarketFilter(filter.value)}
          >
            {filter.label}
          </Pill>
        ))}
      </PillGroup>

      {/* Book filter */}
      <div className="flex gap-2">
        <select
          value={bookFilter}
          onChange={(e) => setBookFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
        >
          {BOOK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Games list */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : data?.games.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No lines available for selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.games.map((game) => (
            <GameCard
              key={game.game_id}
              game={game}
              onLineClick={handleLineClick}
              showProps={!marketFilter || marketFilter === 'player_prop'}
              showGameLines={!marketFilter || marketFilter !== 'player_prop'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface GameCardProps {
  game: Game
  onLineClick: (playerId: number, gameId: string, stat: string, line: number) => void
  showProps: boolean
  showGameLines: boolean
}

function GameCard({ game, onLineClick, showProps, showGameLines }: GameCardProps) {
  const gameTime = new Date(game.scheduled_time)

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <span className="font-semibold text-white">
          {game.away_team.id} @ {game.home_team.id}
        </span>
        <span className="text-sm text-slate-400">{format(gameTime, 'h:mm a')}</span>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Game lines */}
        {showGameLines && game.game_lines.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Game Lines</p>
            {game.game_lines.slice(0, 1).map((line, idx) => (
              <div key={idx} className="space-y-1">
                {line.spread && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-300">Spread</span>
                    <div className="flex gap-4">
                      <span className="text-white">
                        {game.home_team.id} {line.spread.home > 0 ? '+' : ''}
                        {line.spread.home} ({line.spread.home_odds})
                      </span>
                    </div>
                  </div>
                )}
                {line.total && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-300">Total</span>
                    <div className="flex gap-4">
                      <span className="text-white">
                        O {line.total.line} ({line.total.over_odds})
                      </span>
                      <span className="text-white">
                        U ({line.total.under_odds})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Player props */}
        {showProps && game.player_props.length > 0 && (
          <div className="space-y-3">
            {game.player_props.map((playerProps) => (
              <PlayerPropsSection
                key={playerProps.player.id}
                playerProps={playerProps}
                gameId={game.game_id}
                onLineClick={onLineClick}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PlayerPropsSectionProps {
  playerProps: PlayerProps
  gameId: string
  onLineClick: (playerId: number, gameId: string, stat: string, line: number) => void
}

function PlayerPropsSection({ playerProps, gameId, onLineClick }: PlayerPropsSectionProps) {
  // Group props by stat
  const propsByStat = playerProps.props.reduce((acc, prop) => {
    if (!acc[prop.stat]) {
      acc[prop.stat] = []
    }
    acc[prop.stat].push(prop)
    return acc
  }, {} as Record<string, PropLine[]>)

  return (
    <div className="border-t border-slate-700 pt-3">
      <p className="font-medium text-white mb-2">{playerProps.player.name}</p>
      <div className="space-y-1">
        {Object.entries(propsByStat).map(([stat, props]) => {
          const prop = props[0] // Use first book's line
          return (
            <button
              key={stat}
              onClick={() =>
                onLineClick(playerProps.player.id, gameId, stat, prop.line)
              }
              className="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-700 transition-colors"
            >
              <span className="text-slate-300 capitalize">{stat}</span>
              <div className="flex gap-4 text-sm">
                <span className="text-white">
                  O {prop.line}{' '}
                  <span className="text-slate-400">({prop.over_odds})</span>
                </span>
                <span className="text-white">
                  U <span className="text-slate-400">({prop.under_odds})</span>
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
