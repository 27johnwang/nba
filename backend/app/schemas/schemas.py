"""Pydantic schemas for API request/response validation."""
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# =============================================================================
# Auth Schemas
# =============================================================================

class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)


class UserResponse(BaseModel):
    """Schema for user response."""
    id: UUID
    email: str
    preferred_books: list[str] = []
    odds_format: str = "american"
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# =============================================================================
# Team & Player Schemas
# =============================================================================

class TeamBase(BaseModel):
    """Base team schema."""
    id: str
    name: str


class PlayerBase(BaseModel):
    """Base player schema."""
    id: int
    name: str
    team: Optional[str] = None


# =============================================================================
# Lines Schemas
# =============================================================================

class SpreadLine(BaseModel):
    """Spread betting line."""
    home: float
    home_odds: int
    away_odds: int


class TotalLine(BaseModel):
    """Total (over/under) betting line."""
    line: float
    over_odds: int
    under_odds: int


class GameLineResponse(BaseModel):
    """Game-level betting lines."""
    book: str
    spread: Optional[SpreadLine] = None
    total: Optional[TotalLine] = None
    home_team_total: Optional[TotalLine] = None
    away_team_total: Optional[TotalLine] = None


class PropLine(BaseModel):
    """Individual player prop line."""
    book: str
    stat: str
    line: float
    over_odds: int
    under_odds: int


class PlayerPropResponse(BaseModel):
    """Player props grouped by player."""
    player: PlayerBase
    props: list[PropLine]


class GameResponse(BaseModel):
    """Game with all betting lines."""
    game_id: str
    home_team: TeamBase
    away_team: TeamBase
    scheduled_time: datetime
    game_lines: list[GameLineResponse]
    player_props: list[PlayerPropResponse]


class LinesResponse(BaseModel):
    """Response for lines endpoint."""
    date: str
    games: list[GameResponse]


class LineResponse(BaseModel):
    """Single line details."""
    player: PlayerBase
    stat: str
    value: float
    side: str


# =============================================================================
# Analysis Schemas
# =============================================================================

class AnalyzeRequest(BaseModel):
    """Request for analysis generation."""
    player_id: int
    game_id: str
    stat: str = Field(..., description="points, rebounds, assists, etc.")
    line: float
    side: str = Field(..., pattern="^(over|under)$")


class HitRate(BaseModel):
    """Hit rate statistics."""
    hits: int
    total: int
    percentage: float


class EssentialStats(BaseModel):
    """Essential statistics for analysis."""
    l10_average: float
    season_average: float
    season_median: float
    hit_rate_l10: HitRate
    hit_rate_season: HitRate


class RecentVsBaseline(BaseModel):
    """Recent performance vs baseline comparison."""
    trend: str  # 'up', 'down', 'stable'
    summary: str
    l10_vs_season: float
    recent_games: list[int]


class MatchupData(BaseModel):
    """Matchup context data."""
    opponent: TeamBase
    opponent_rank: str
    opponent_avg_allowed: float
    h2h_this_season: Optional[dict] = None
    home_away_split: Optional[dict] = None
    summary: str


class RiskFlag(BaseModel):
    """Risk/volatility flag."""
    type: str
    severity: str  # 'low', 'medium', 'high'
    description: str


class AnalyzeResponse(BaseModel):
    """Complete analysis response."""
    line: LineResponse
    essential: EssentialStats
    what_needs_to_happen: str
    recent_vs_baseline: RecentVsBaseline
    matchup: MatchupData
    risk_flags: list[RiskFlag]
    takeaway: str


# =============================================================================
# Player Splits Schemas
# =============================================================================

class StatsData(BaseModel):
    """Computed statistics."""
    average: float
    median: float
    std_dev: float
    min: int
    max: int
    games_played: int


class GameStatEntry(BaseModel):
    """Single game stat entry."""
    date: str
    opponent: str
    value: int
    minutes: float


class DistributionBucket(BaseModel):
    """Distribution histogram bucket."""
    range: str
    count: int


class PlayerSplitsResponse(BaseModel):
    """Player splits response."""
    player: PlayerBase
    stat: str
    window: int
    filters: dict
    stats: StatsData
    games: list[GameStatEntry]
    distribution: dict


class PlayerStatsResponse(BaseModel):
    """Basic player stats response."""
    player: PlayerBase
    season_stats: dict[str, float]
    recent_games: list[dict]


# =============================================================================
# Trends Schemas
# =============================================================================

class TrendResponse(BaseModel):
    """Single trend entry."""
    player: PlayerBase
    stat: str
    reference_line: float
    l10_average: float
    season_average: float
    hit_rate: HitRate
    trend_score: float


class TrendsResponse(BaseModel):
    """Trends list response."""
    type: str  # 'hot', 'cold', 'consistent'
    trends: list[TrendResponse]


# =============================================================================
# Favorites & Tracking Schemas
# =============================================================================

class FavoriteRequest(BaseModel):
    """Request to add/remove favorite."""
    action: str = Field(..., pattern="^(add|remove)$")
    entity_type: str = Field(..., pattern="^(player|team|market)$")
    entity_id: str


class FavoriteResponse(BaseModel):
    """Favorite operation response."""
    success: bool
    favorites_count: int


class TrackedBetRequest(BaseModel):
    """Request to track a bet."""
    game_id: str
    player_id: Optional[int] = None
    market_type: str
    prop_type: Optional[str] = None
    line_value: float
    bet_side: str = Field(..., pattern="^(over|under|home|away)$")
    odds: int


class TrackedBetResponse(BaseModel):
    """Tracked bet entry."""
    id: int
    game: dict
    player: Optional[PlayerBase] = None
    market: str
    prop: Optional[str] = None
    line: float
    side: str
    odds: int
    tracked_at: datetime
    status: str  # 'pending', 'won', 'lost', 'push'
    actual_value: Optional[float] = None
    result: Optional[str] = None


class ProfileSummary(BaseModel):
    """Profile summary statistics."""
    total: int
    won: int
    lost: int
    push: int
    pending: int
    win_rate: float


class ProfileHistoryResponse(BaseModel):
    """Profile history response."""
    summary: ProfileSummary
    bets: list[TrackedBetResponse]
    pagination: dict


# =============================================================================
# LLM Analysis JSON Schema
# =============================================================================

ANALYSIS_LLM_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["what_needs_to_happen", "recent_vs_baseline", "matchup_summary", "risk_flags", "takeaway"],
    "properties": {
        "what_needs_to_happen": {
            "type": "string",
            "description": "1-2 sentences explaining what the player needs to do vs the line",
            "maxLength": 300
        },
        "recent_vs_baseline": {
            "type": "string",
            "description": "2-3 sentences comparing recent performance to season baseline",
            "maxLength": 500
        },
        "matchup_summary": {
            "type": "string",
            "description": "2-3 sentences on opponent matchup and H2H context",
            "maxLength": 500
        },
        "risk_flags": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["type", "severity", "description"],
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": [
                            "minutes_volatility",
                            "blowout_risk",
                            "role_change",
                            "back_to_back",
                            "teammate_injury",
                            "cold_streak",
                            "hot_streak"
                        ]
                    },
                    "severity": {
                        "type": "string",
                        "enum": ["low", "medium", "high"]
                    },
                    "description": {
                        "type": "string",
                        "maxLength": 200
                    }
                }
            }
        },
        "takeaway": {
            "type": "string",
            "description": "2-3 sentence neutral summary without betting recommendation",
            "maxLength": 500
        }
    },
    "additionalProperties": False
}
