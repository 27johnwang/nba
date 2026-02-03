"""Trends endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models import Player, ComputedFeature
from app.services.stats_service import StatsService

router = APIRouter(prefix="/trends", tags=["trends"])


# Mock trends data for demonstration
MOCK_TRENDS = {
    "hot": [
        {
            "player": {"id": 1630178, "name": "Tyrese Maxey", "team": "PHI"},
            "stat": "points",
            "reference_line": 23.5,
            "l10_average": 28.4,
            "season_average": 25.1,
            "hit_rate": {"hits": 9, "total": 10, "percentage": 90.0},
            "trend_score": 92.5,
        },
        {
            "player": {"id": 203506, "name": "Domantas Sabonis", "team": "SAC"},
            "stat": "rebounds",
            "reference_line": 12.5,
            "l10_average": 14.2,
            "season_average": 13.1,
            "hit_rate": {"hits": 10, "total": 10, "percentage": 100.0},
            "trend_score": 95.0,
        },
        {
            "player": {"id": 1629029, "name": "Trae Young", "team": "ATL"},
            "stat": "assists",
            "reference_line": 10.5,
            "l10_average": 12.3,
            "season_average": 10.8,
            "hit_rate": {"hits": 8, "total": 10, "percentage": 80.0},
            "trend_score": 85.0,
        },
        {
            "player": {"id": 1628983, "name": "Shai Gilgeous-Alexander", "team": "OKC"},
            "stat": "points",
            "reference_line": 30.5,
            "l10_average": 33.2,
            "season_average": 31.5,
            "hit_rate": {"hits": 8, "total": 10, "percentage": 80.0},
            "trend_score": 87.5,
        },
        {
            "player": {"id": 203954, "name": "Joel Embiid", "team": "PHI"},
            "stat": "points",
            "reference_line": 32.5,
            "l10_average": 35.8,
            "season_average": 33.2,
            "hit_rate": {"hits": 7, "total": 10, "percentage": 70.0},
            "trend_score": 82.0,
        },
    ],
    "cold": [
        {
            "player": {"id": 1627826, "name": "Zion Williamson", "team": "NOP"},
            "stat": "points",
            "reference_line": 24.5,
            "l10_average": 21.3,
            "season_average": 24.8,
            "hit_rate": {"hits": 2, "total": 10, "percentage": 20.0},
            "trend_score": 25.0,
        },
        {
            "player": {"id": 203081, "name": "Damian Lillard", "team": "MIL"},
            "stat": "points",
            "reference_line": 26.5,
            "l10_average": 22.8,
            "season_average": 25.2,
            "hit_rate": {"hits": 3, "total": 10, "percentage": 30.0},
            "trend_score": 32.0,
        },
        {
            "player": {"id": 201566, "name": "Russell Westbrook", "team": "DEN"},
            "stat": "assists",
            "reference_line": 7.5,
            "l10_average": 5.2,
            "season_average": 6.8,
            "hit_rate": {"hits": 2, "total": 10, "percentage": 20.0},
            "trend_score": 28.0,
        },
        {
            "player": {"id": 1629627, "name": "Zach LaVine", "team": "CHI"},
            "stat": "points",
            "reference_line": 23.5,
            "l10_average": 19.5,
            "season_average": 22.1,
            "hit_rate": {"hits": 3, "total": 10, "percentage": 30.0},
            "trend_score": 35.0,
        },
    ],
    "consistent": [
        {
            "player": {"id": 203999, "name": "Nikola Jokic", "team": "DEN"},
            "stat": "assists",
            "reference_line": 9.5,
            "l10_average": 9.8,
            "season_average": 9.5,
            "hit_rate": {"hits": 7, "total": 10, "percentage": 70.0},
            "trend_score": 72.0,
        },
        {
            "player": {"id": 1628389, "name": "Bam Adebayo", "team": "MIA"},
            "stat": "rebounds",
            "reference_line": 10.5,
            "l10_average": 10.8,
            "season_average": 10.5,
            "hit_rate": {"hits": 6, "total": 10, "percentage": 60.0},
            "trend_score": 65.0,
        },
        {
            "player": {"id": 201142, "name": "Kevin Durant", "team": "PHX"},
            "stat": "points",
            "reference_line": 27.5,
            "l10_average": 27.8,
            "season_average": 27.2,
            "hit_rate": {"hits": 5, "total": 10, "percentage": 50.0},
            "trend_score": 55.0,
        },
    ],
}


@router.get("")
async def get_trends(
    type: str = Query("hot", description="Trend type: hot, cold, consistent"),
    stat: Optional[str] = Query(None, description="Filter by stat type"),
    limit: int = Query(10, description="Number of results"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get league-wide trends (hot/cold streaks, consistent performers).

    Returns players with notable recent performance patterns.
    """
    # For MVP, return mock data
    # In production, this would query computed_features table
    trends = MOCK_TRENDS.get(type, [])

    # Filter by stat if specified
    if stat:
        trends = [t for t in trends if t["stat"] == stat]

    # Apply limit
    trends = trends[:limit]

    return {
        "type": type,
        "trends": trends,
    }


@router.get("/player/{player_id}")
async def get_player_trends(
    player_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get trend analysis for a specific player across all stats."""
    stats_service = StatsService(db)

    player_info = await stats_service.get_player_info(player_id)
    if not player_info:
        return {"player": None, "trends": []}

    game_logs = await stats_service.get_player_game_logs(player_id)

    trends = []
    for stat in ["points", "rebounds", "assists", "steals", "blocks"]:
        l10_avg = stats_service.last_n_average(game_logs, stat, 10)
        season_avg = stats_service.season_average(game_logs, stat)

        if l10_avg is None or season_avg is None:
            continue

        direction = stats_service.get_trend_direction(game_logs, stat)
        diff = round(l10_avg - season_avg, 1)

        trends.append({
            "stat": stat,
            "l10_average": l10_avg,
            "season_average": season_avg,
            "difference": diff,
            "direction": direction,
        })

    return {
        "player": {
            "id": player_info["id"],
            "name": player_info["name"],
            "team": player_info.get("team"),
        },
        "trends": trends,
    }
