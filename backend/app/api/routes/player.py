"""Player endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.stats_service import StatsService

router = APIRouter(prefix="/player", tags=["player"])


@router.get("/{player_id}/splits")
async def get_player_splits(
    player_id: int,
    stat: str = Query(..., description="Stat type (points, rebounds, assists, etc.)"),
    window: int = Query(10, description="Number of games (10, 20, or 0 for season)"),
    opponent: Optional[str] = Query(None, description="Filter by opponent team ID"),
    home_away: Optional[str] = Query(None, description="home or away"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get player statistical splits with optional filters.

    Returns averages, median, distribution, and game-by-game breakdown.
    """
    stats_service = StatsService(db)

    # Get player info
    player_info = await stats_service.get_player_info(player_id)
    if not player_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player {player_id} not found",
        )

    # Get game logs with filters
    limit = window if window > 0 else None
    game_logs = await stats_service.get_player_game_logs(
        player_id=player_id,
        limit=limit,
        opponent_id=opponent,
        home_away=home_away,
    )

    if not game_logs:
        return {
            "player": {
                "id": player_info["id"],
                "name": player_info["name"],
                "team": player_info.get("team"),
            },
            "stat": stat,
            "window": window,
            "filters": {
                "opponent": opponent,
                "home_away": home_away,
            },
            "stats": None,
            "games": [],
            "distribution": {"buckets": []},
        }

    # Calculate stats
    avg = stats_service.season_average(game_logs, stat) or 0
    median = stats_service.season_median(game_logs, stat) or 0
    std = stats_service.std_dev(game_logs, stat) or 0

    values = [stats_service.get_stat_value(g, stat) for g in game_logs]
    min_val = min(values) if values else 0
    max_val = max(values) if values else 0

    # Build games list
    games = [
        {
            "date": log.date,
            "opponent": log.opponent_id,
            "value": stats_service.get_stat_value(log, stat),
            "minutes": log.minutes,
        }
        for log in game_logs
    ]

    # Calculate distribution
    distribution = stats_service.distribution_bins(game_logs, stat)
    buckets = [{"range": k, "count": v} for k, v in distribution.items()]

    return {
        "player": {
            "id": player_info["id"],
            "name": player_info["name"],
            "team": player_info.get("team"),
        },
        "stat": stat,
        "window": window,
        "filters": {
            "opponent": opponent,
            "home_away": home_away,
        },
        "stats": {
            "average": avg,
            "median": median,
            "std_dev": std,
            "min": min_val,
            "max": max_val,
            "games_played": len(game_logs),
        },
        "games": games,
        "distribution": {"buckets": buckets},
    }


@router.get("/{player_id}")
async def get_player(
    player_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get player basic info and recent stats."""
    stats_service = StatsService(db)

    player_info = await stats_service.get_player_info(player_id)
    if not player_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player {player_id} not found",
        )

    game_logs = await stats_service.get_player_game_logs(player_id)

    # Calculate season averages
    season_stats = {}
    for stat in ["points", "rebounds", "assists", "steals", "blocks"]:
        avg = stats_service.season_average(game_logs, stat)
        if avg is not None:
            season_stats[stat] = avg

    # Recent games
    recent = [
        {
            "date": log.date,
            "opponent": log.opponent_id,
            "points": log.points,
            "rebounds": log.rebounds,
            "assists": log.assists,
            "minutes": log.minutes,
        }
        for log in game_logs[:5]
    ]

    return {
        "player": {
            "id": player_info["id"],
            "name": player_info["name"],
            "team": player_info.get("team"),
            "position": player_info.get("position"),
        },
        "season_stats": season_stats,
        "recent_games": recent,
    }
