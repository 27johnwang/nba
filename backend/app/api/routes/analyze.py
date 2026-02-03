"""Analysis endpoints."""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models import User, Player, Game, Analysis
from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.stats_service import StatsService, GameContext
from app.services.analysis_service import AnalysisService
from app.services.odds_service import OddsService

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze_line(
    request: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
) -> dict:
    """
    Generate analysis for a specific betting line.

    Returns essential stats, LLM-generated insights, matchup context,
    and risk flags for the specified player prop or game line.
    """
    stats_service = StatsService(db)
    analysis_service = AnalysisService()
    odds_service = OddsService()

    # Get player info
    player_info = await stats_service.get_player_info(request.player_id)
    if not player_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player {request.player_id} not found",
        )

    # Get game info
    game_result = await db.execute(select(Game).where(Game.id == request.game_id))
    game = game_result.scalar_one_or_none()

    # Determine opponent and home/away
    if game:
        if player_info["team"] == game.home_team_id:
            opponent_id = game.away_team_id
            home_away = "home"
        else:
            opponent_id = game.home_team_id
            home_away = "away"
        game_date = game.date.strftime("%Y-%m-%d") if game.date else "Unknown"
    else:
        # Use mock data for demo
        opponent_id = "BOS"
        home_away = "away"
        game_date = datetime.now().strftime("%Y-%m-%d")

    opponent_info = await stats_service.get_team_info(opponent_id) or {"id": opponent_id, "name": opponent_id}

    # Check for cached analysis
    cache_result = await db.execute(
        select(Analysis)
        .where(Analysis.player_id == request.player_id)
        .where(Analysis.game_id == request.game_id)
        .where(Analysis.stat_type == request.stat)
        .where(Analysis.line_value == request.line)
        .where(Analysis.expires_at > datetime.utcnow())
    )
    cached = cache_result.scalar_one_or_none()

    if cached:
        # Use cached analysis
        analysis_json = cached.analysis_json
    else:
        # Compute fresh analysis
        # Get game logs
        all_logs = await stats_service.get_player_game_logs(request.player_id)
        opponent_logs = await stats_service.get_player_game_logs(
            request.player_id, opponent_id=opponent_id
        )
        split_logs = await stats_service.get_player_game_logs(
            request.player_id, home_away=home_away
        )

        # Calculate essential metrics
        l10_avg = stats_service.last_n_average(all_logs, request.stat, 10) or 0
        season_avg = stats_service.season_average(all_logs, request.stat) or 0
        season_med = stats_service.season_median(all_logs, request.stat) or 0

        l10_hit = stats_service.hit_rate(all_logs, request.stat, request.line, n=10)
        season_hit = stats_service.hit_rate(all_logs, request.stat, request.line)

        l10_std = stats_service.std_dev(all_logs, request.stat, n=10)

        # Matchup stats
        h2h_avg = stats_service.season_average(opponent_logs, request.stat)
        h2h_hit = stats_service.hit_rate(opponent_logs, request.stat, request.line)

        split_avg = stats_service.season_average(split_logs, request.stat)
        split_hit = stats_service.hit_rate(split_logs, request.stat, request.line)

        # Recent values
        recent_values = [
            stats_service.get_stat_value(log, request.stat)
            for log in all_logs[:10]
        ]

        # Build context for LLM
        computed_metrics = {
            "stat_type": request.stat,
            "line_value": request.line,
            "l10_avg": l10_avg,
            "season_avg": season_avg,
            "season_median": season_med,
            "l10_hits": l10_hit["hits"],
            "l10_games": l10_hit["total"],
            "l10_hit_pct": l10_hit["percentage"],
            "season_hits": season_hit["hits"],
            "season_games": season_hit["total"],
            "season_hit_pct": season_hit["percentage"],
            "l10_std_dev": l10_std,
            "recent_values": recent_values,
        }

        matchup_data = {
            "opponent_id": opponent_id,
            "opponent_name": opponent_info["name"],
            "opp_rank": "N/A",  # Would need defensive stats
            "opp_avg_allowed": "N/A",
            "h2h_games": len(opponent_logs),
            "h2h_avg": h2h_avg,
            "h2h_hits": h2h_hit["hits"],
            "split_avg": split_avg,
            "split_hit_pct": split_hit["percentage"],
        }

        # Get spread for context (mock for now)
        spread = -4.5 if home_away == "away" else 4.5

        context = {
            "side": request.side,
            "home_away": home_away,
            "game_date": game_date,
            "spread": spread,
            "rest_days": 1,  # Would need schedule analysis
            "injured_list": "None",
        }

        # Generate LLM analysis
        llm_analysis = await analysis_service.generate_analysis(
            player_data=player_info,
            computed_metrics=computed_metrics,
            matchup_data=matchup_data,
            context=context,
        )

        # Calculate volatility flags
        game_context = GameContext(spread=spread, rest_days=1, injured_teammates=[])
        volatility_flags = stats_service.calculate_volatility_flags(all_logs, game_context)

        # Merge LLM risk flags with computed flags
        all_flags = volatility_flags + llm_analysis.get("risk_flags", [])
        # Deduplicate by type
        seen_types = set()
        unique_flags = []
        for flag in all_flags:
            if flag["type"] not in seen_types:
                seen_types.add(flag["type"])
                unique_flags.append(flag)

        # Determine trend
        trend = stats_service.get_trend_direction(all_logs, request.stat)

        # Build full analysis JSON
        analysis_json = {
            "essential": {
                "l10_average": l10_avg,
                "season_average": season_avg,
                "season_median": season_med,
                "hit_rate_l10": l10_hit,
                "hit_rate_season": season_hit,
            },
            "what_needs_to_happen": llm_analysis.get("what_needs_to_happen", ""),
            "recent_vs_baseline": {
                "trend": trend,
                "summary": llm_analysis.get("recent_vs_baseline", ""),
                "l10_vs_season": round(l10_avg - season_avg, 1),
                "recent_games": recent_values,
            },
            "matchup": {
                "opponent": opponent_info,
                "opponent_rank": matchup_data["opp_rank"],
                "opponent_avg_allowed": matchup_data["opp_avg_allowed"],
                "h2h_this_season": {
                    "games": len(opponent_logs),
                    "average": h2h_avg,
                    "hit_rate": h2h_hit["hits"],
                },
                "home_away_split": {
                    "location": home_away,
                    "average": split_avg,
                    "hit_rate_pct": split_hit["percentage"],
                },
                "summary": llm_analysis.get("matchup_summary", ""),
            },
            "risk_flags": unique_flags,
            "takeaway": llm_analysis.get("takeaway", ""),
        }

        # Cache the analysis
        new_analysis = Analysis(
            user_id=current_user.id if current_user else None,
            player_id=request.player_id,
            game_id=request.game_id,
            stat_type=request.stat,
            line_value=request.line,
            analysis_json=analysis_json,
            expires_at=datetime.utcnow() + timedelta(hours=6),
        )
        db.add(new_analysis)
        await db.commit()

    # Build response
    return {
        "line": {
            "player": {"id": player_info["id"], "name": player_info["name"]},
            "stat": request.stat,
            "value": request.line,
            "side": request.side,
        },
        **analysis_json,
    }
