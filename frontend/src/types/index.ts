// Team types
export interface Team {
  id: string
  name: string
}

// Player types
export interface Player {
  id: number
  name: string
  team?: string
}

// Line types
export interface SpreadLine {
  home: number
  home_odds: number
  away_odds: number
}

export interface TotalLine {
  line: number
  over_odds: number
  under_odds: number
}

export interface GameLine {
  book: string
  spread?: SpreadLine
  total?: TotalLine
  home_team_total?: TotalLine
  away_team_total?: TotalLine
}

export interface PropLine {
  book: string
  stat: string
  line: number
  over_odds: number
  under_odds: number
}

export interface PlayerProps {
  player: Player
  props: PropLine[]
}

export interface Game {
  game_id: string
  home_team: Team
  away_team: Team
  scheduled_time: string
  game_lines: GameLine[]
  player_props: PlayerProps[]
}

export interface LinesResponse {
  date: string
  games: Game[]
}

// Analysis types
export interface HitRate {
  hits: number
  total: number
  percentage: number
}

export interface EssentialStats {
  l10_average: number
  season_average: number
  season_median: number
  hit_rate_l10: HitRate
  hit_rate_season: HitRate
}

export interface RecentVsBaseline {
  trend: 'up' | 'down' | 'stable'
  summary: string
  l10_vs_season: number
  recent_games: number[]
}

export interface MatchupData {
  opponent: Team
  opponent_rank: string
  opponent_avg_allowed: number | string
  h2h_this_season?: {
    games: number
    average: number | null
    hit_rate: number
  }
  home_away_split?: {
    location: string
    average: number | null
    hit_rate_pct: number
  }
  summary: string
}

export interface RiskFlag {
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface AnalysisLine {
  player: Player
  stat: string
  value: number
  side: string
}

export interface AnalysisResponse {
  line: AnalysisLine
  essential: EssentialStats
  what_needs_to_happen: string
  recent_vs_baseline: RecentVsBaseline
  matchup: MatchupData
  risk_flags: RiskFlag[]
  takeaway: string
}

// Trend types
export interface Trend {
  player: Player
  stat: string
  reference_line: number
  l10_average: number
  season_average: number
  hit_rate: HitRate
  trend_score: number
}

export interface TrendsResponse {
  type: string
  trends: Trend[]
}

// Profile types
export interface TrackedBet {
  id: number
  game: {
    id: string
    matchup: string
    date: string
    time: string
  }
  player?: Player
  market: string
  prop?: string
  line: number
  side: string
  odds: number
  tracked_at: string
  status: string
  actual_value?: number
  result?: string
}

export interface ProfileSummary {
  total: number
  won: number
  lost: number
  push: number
  pending: number
  win_rate: number
}

export interface ProfileHistoryResponse {
  summary: ProfileSummary
  bets: TrackedBet[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}
