"""Statistics computation service."""
import statistics
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Player, PlayerGameStats, Game, Team


@dataclass
class GameLog:
    """Single game log entry."""
    game_id: str
    date: str
    opponent_id: str
    is_home: bool
    minutes: float
    points: int
    rebounds: int
    assists: int
    steals: int
    blocks: int
    turnovers: int
    three_pointers_made: int
    is_starter: bool


@dataclass
class GameContext:
    """Context for a specific game."""
    spread: float
    rest_days: int
    injured_teammates: list[dict]


class StatsService:
    """Service for computing player and team statistics."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_player_game_logs(
        self,
        player_id: int,
        limit: Optional[int] = None,
        opponent_id: Optional[str] = None,
        home_away: Optional[str] = None,
    ) -> list[GameLog]:
        """Fetch player game logs with optional filters."""
        query = (
            select(
                PlayerGameStats,
                Game.date,
                Game.home_team_id,
                Game.away_team_id,
            )
            .join(Game, PlayerGameStats.game_id == Game.id)
            .where(PlayerGameStats.player_id == player_id)
            .where(Game.status == "final")
            .order_by(desc(Game.date))
        )

        if opponent_id:
            query = query.where(
                (Game.home_team_id == opponent_id) | (Game.away_team_id == opponent_id)
            )

        if limit:
            query = query.limit(limit)

        result = await self.db.execute(query)
        rows = result.fetchall()

        logs = []
        for row in rows:
            stats = row[0]
            game_date = row[1]
            home_team_id = row[2]
            away_team_id = row[3]

            is_home = stats.team_id == home_team_id
            opponent = away_team_id if is_home else home_team_id

            if home_away:
                if home_away == "home" and not is_home:
                    continue
                if home_away == "away" and is_home:
                    continue

            logs.append(GameLog(
                game_id=stats.game_id,
                date=game_date.strftime("%Y-%m-%d") if game_date else "",
                opponent_id=opponent,
                is_home=is_home,
                minutes=float(stats.minutes or 0),
                points=stats.points or 0,
                rebounds=stats.rebounds or 0,
                assists=stats.assists or 0,
                steals=stats.steals or 0,
                blocks=stats.blocks or 0,
                turnovers=stats.turnovers or 0,
                three_pointers_made=stats.three_pointers_made or 0,
                is_starter=stats.is_starter or False,
            ))

        return logs

    def get_stat_value(self, log: GameLog, stat: str) -> int:
        """Extract stat value from game log."""
        stat_map = {
            "points": log.points,
            "rebounds": log.rebounds,
            "assists": log.assists,
            "steals": log.steals,
            "blocks": log.blocks,
            "turnovers": log.turnovers,
            "three_pointers_made": log.three_pointers_made,
            "threes": log.three_pointers_made,
            "3pm": log.three_pointers_made,
        }
        return stat_map.get(stat.lower(), 0)

    def last_n_average(self, game_logs: list[GameLog], stat: str, n: int) -> Optional[float]:
        """Calculate average of stat over last N games."""
        recent_games = game_logs[:n]
        if not recent_games:
            return None

        values = [self.get_stat_value(g, stat) for g in recent_games]
        return round(sum(values) / len(values), 1)

    def season_average(self, game_logs: list[GameLog], stat: str) -> Optional[float]:
        """Calculate season average for stat."""
        if not game_logs:
            return None

        values = [self.get_stat_value(g, stat) for g in game_logs]
        return round(sum(values) / len(values), 1)

    def season_median(self, game_logs: list[GameLog], stat: str) -> Optional[float]:
        """Calculate median value for stat."""
        if not game_logs:
            return None

        values = sorted([self.get_stat_value(g, stat) for g in game_logs])
        n = len(values)
        mid = n // 2

        if n % 2 == 0:
            return round((values[mid - 1] + values[mid]) / 2, 1)
        return float(values[mid])

    def hit_rate(
        self,
        game_logs: list[GameLog],
        stat: str,
        line: float,
        n: Optional[int] = None,
    ) -> dict:
        """Calculate how often player exceeds line."""
        games = game_logs[:n] if n else game_logs
        if not games:
            return {"hits": 0, "total": 0, "percentage": 0.0}

        hits = sum(1 for g in games if self.get_stat_value(g, stat) > line)
        total = len(games)

        return {
            "hits": hits,
            "total": total,
            "percentage": round((hits / total) * 100, 1) if total > 0 else 0.0,
        }

    def std_dev(self, game_logs: list[GameLog], stat: str, n: Optional[int] = None) -> Optional[float]:
        """Calculate standard deviation for stat."""
        games = game_logs[:n] if n else game_logs
        if len(games) < 2:
            return None

        values = [self.get_stat_value(g, stat) for g in games]
        return round(statistics.stdev(values), 2)

    def distribution_bins(
        self,
        game_logs: list[GameLog],
        stat: str,
        bin_size: int = 5,
    ) -> dict[str, int]:
        """Create histogram buckets for stat distribution."""
        values = [self.get_stat_value(g, stat) for g in game_logs]
        if not values:
            return {}

        min_val = (min(values) // bin_size) * bin_size
        max_val = ((max(values) // bin_size) + 1) * bin_size

        bins = {}
        for start in range(min_val, max_val, bin_size):
            end = start + bin_size - 1
            key = f"{start}-{end}"
            bins[key] = sum(1 for v in values if start <= v <= end)

        return bins

    def calculate_volatility_flags(
        self,
        game_logs: list[GameLog],
        game_context: Optional[GameContext] = None,
    ) -> list[dict]:
        """Identify risk factors for the bet."""
        flags = []

        if not game_logs:
            return flags

        # 1. Minutes volatility (std dev > 4 minutes)
        minutes = [g.minutes for g in game_logs[:10] if g.minutes > 0]
        if len(minutes) > 1:
            std_dev = statistics.stdev(minutes)
            if std_dev > 4:
                flags.append({
                    "type": "minutes_volatility",
                    "severity": "medium" if std_dev < 6 else "high",
                    "description": f"Minutes vary significantly (std dev: {std_dev:.1f}). "
                                  f"Range: {min(minutes):.0f}-{max(minutes):.0f} in L10.",
                })

        if game_context:
            # 2. Blowout risk (spread > 8)
            if abs(game_context.spread) > 8:
                favored = "favorite" if game_context.spread < 0 else "underdog"
                flags.append({
                    "type": "blowout_risk",
                    "severity": "medium" if abs(game_context.spread) < 12 else "high",
                    "description": f"Team is {abs(game_context.spread):.1f}-point {favored}. "
                                  f"Blowouts may affect playing time.",
                })

            # 3. Back-to-back game
            if game_context.rest_days == 0:
                flags.append({
                    "type": "back_to_back",
                    "severity": "medium",
                    "description": "Playing on zero rest (back-to-back). "
                                  "May see reduced minutes or load management.",
                })

            # 4. Key teammate injury
            for teammate in game_context.injured_teammates:
                if teammate.get("is_key_player"):
                    flags.append({
                        "type": "teammate_injury",
                        "severity": "medium",
                        "description": f"{teammate.get('name', 'Key player')} is out. "
                                      "This may affect usage/opportunities.",
                    })

        # 5. Role change (starter status changed recently)
        if len(game_logs) >= 10:
            recent_starts = [g.is_starter for g in game_logs[:5]]
            season_start_rate = sum(1 for g in game_logs if g.is_starter) / len(game_logs)
            recent_start_rate = sum(recent_starts) / len(recent_starts) if recent_starts else 0

            if abs(recent_start_rate - season_start_rate) > 0.4:
                flags.append({
                    "type": "role_change",
                    "severity": "high",
                    "description": "Recent change in starting role may affect production.",
                })

        return flags

    def get_trend_direction(self, game_logs: list[GameLog], stat: str) -> str:
        """Determine if player is trending up, down, or stable."""
        if len(game_logs) < 10:
            return "stable"

        l10_avg = self.last_n_average(game_logs, stat, 10)
        season_avg = self.season_average(game_logs, stat)

        if l10_avg is None or season_avg is None:
            return "stable"

        diff = l10_avg - season_avg
        if diff > 1.5:
            return "up"
        elif diff < -1.5:
            return "down"
        return "stable"

    async def get_player_info(self, player_id: int) -> Optional[dict]:
        """Get player basic info."""
        query = select(Player).where(Player.id == player_id)
        result = await self.db.execute(query)
        player = result.scalar_one_or_none()

        if not player:
            return None

        return {
            "id": player.id,
            "name": player.name,
            "team": player.team_id,
            "position": player.position,
        }

    async def get_team_info(self, team_id: str) -> Optional[dict]:
        """Get team basic info."""
        query = select(Team).where(Team.id == team_id)
        result = await self.db.execute(query)
        team = result.scalar_one_or_none()

        if not team:
            return None

        return {
            "id": team.id,
            "name": team.name,
        }
