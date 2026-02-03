"""Betting lines endpoints."""
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.services.odds_service import OddsService

router = APIRouter(prefix="/lines", tags=["lines"])


def get_odds_service() -> OddsService:
    """Dependency for odds service."""
    return OddsService()


@router.get("")
async def get_lines(
    date_str: Optional[str] = Query(None, alias="date", description="Date in YYYY-MM-DD format"),
    book: Optional[str] = Query(None, description="Filter by book (draftkings, fanduel, etc.)"),
    market: Optional[str] = Query(None, description="Filter by market type (spread, total, player_prop)"),
    team: Optional[str] = Query(None, description="Filter by team ID (LAL, BOS, etc.)"),
    odds_service: OddsService = Depends(get_odds_service),
) -> dict:
    """
    Get betting lines for a given date.

    Returns game lines and player props from available sportsbooks.
    """
    # Parse date or use today
    if date_str:
        try:
            game_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            game_date = date.today()
    else:
        game_date = date.today()

    return await odds_service.get_lines(
        game_date=game_date,
        market=market,
        book=book,
        team=team,
    )


@router.get("/game/{game_id}/props")
async def get_game_player_props(
    game_id: str,
    odds_service: OddsService = Depends(get_odds_service),
) -> dict:
    """Get all player props for a specific game."""
    props = await odds_service.get_player_props(game_id)
    return {"game_id": game_id, "player_props": props}
