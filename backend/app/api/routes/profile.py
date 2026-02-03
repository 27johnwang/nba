"""Profile and tracking endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_required
from app.db.database import get_db
from app.models import User, Favorite, TrackedBet, Game, Player
from app.schemas import (
    FavoriteRequest,
    FavoriteResponse,
    TrackedBetRequest,
    TrackedBetResponse,
    ProfileHistoryResponse,
)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/history")
async def get_history(
    status_filter: Optional[str] = Query(None, alias="status", description="pending, won, lost, push"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_required),
) -> dict:
    """Get user's tracked bet history with summary statistics."""
    # Get summary stats
    summary_query = select(
        func.count(TrackedBet.id).label("total"),
        func.count(TrackedBet.id).filter(TrackedBet.result == "won").label("won"),
        func.count(TrackedBet.id).filter(TrackedBet.result == "lost").label("lost"),
        func.count(TrackedBet.id).filter(TrackedBet.result == "push").label("push"),
        func.count(TrackedBet.id).filter(TrackedBet.result.is_(None)).label("pending"),
    ).where(TrackedBet.user_id == current_user.id)

    summary_result = await db.execute(summary_query)
    summary_row = summary_result.one()

    total = summary_row.total
    won = summary_row.won
    lost = summary_row.lost
    push = summary_row.push
    pending = summary_row.pending

    # Calculate win rate (exclude pending and push)
    decided = won + lost
    win_rate = round((won / decided) * 100, 1) if decided > 0 else 0.0

    # Get bets with pagination
    bets_query = (
        select(TrackedBet)
        .where(TrackedBet.user_id == current_user.id)
        .order_by(TrackedBet.tracked_at.desc())
    )

    if status_filter:
        if status_filter == "pending":
            bets_query = bets_query.where(TrackedBet.result.is_(None))
        else:
            bets_query = bets_query.where(TrackedBet.result == status_filter)

    bets_query = bets_query.offset(offset).limit(limit)
    bets_result = await db.execute(bets_query)
    bets = bets_result.scalars().all()

    # Format bets
    formatted_bets = []
    for bet in bets:
        # Get game info
        game_info = {"id": bet.game_id, "matchup": "Unknown", "date": "", "time": ""}
        if bet.game_id:
            game_result = await db.execute(select(Game).where(Game.id == bet.game_id))
            game = game_result.scalar_one_or_none()
            if game:
                game_info = {
                    "id": game.id,
                    "matchup": f"{game.away_team_id} @ {game.home_team_id}",
                    "date": game.date.strftime("%Y-%m-%d") if game.date else "",
                    "time": game.scheduled_time.strftime("%I:%M %p") if game.scheduled_time else "",
                }

        # Get player info
        player_info = None
        if bet.player_id:
            player_result = await db.execute(select(Player).where(Player.id == bet.player_id))
            player = player_result.scalar_one_or_none()
            if player:
                player_info = {"id": player.id, "name": player.name}

        formatted_bets.append({
            "id": bet.id,
            "game": game_info,
            "player": player_info,
            "market": bet.market_type,
            "prop": bet.prop_type,
            "line": float(bet.line_value),
            "side": bet.bet_side,
            "odds": bet.odds,
            "tracked_at": bet.tracked_at.isoformat() if bet.tracked_at else None,
            "status": bet.result or "pending",
            "actual_value": float(bet.actual_value) if bet.actual_value else None,
            "result": bet.result,
        })

    return {
        "summary": {
            "total": total,
            "won": won,
            "lost": lost,
            "push": push,
            "pending": pending,
            "win_rate": win_rate,
        },
        "bets": formatted_bets,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total": total,
        },
    }


@router.post("/tracked-bets", status_code=status.HTTP_201_CREATED)
async def track_bet(
    request: TrackedBetRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_required),
) -> dict:
    """Track a new bet for the user."""
    tracked_bet = TrackedBet(
        user_id=current_user.id,
        game_id=request.game_id,
        player_id=request.player_id,
        market_type=request.market_type,
        prop_type=request.prop_type,
        line_value=request.line_value,
        bet_side=request.bet_side,
        odds=request.odds,
    )

    db.add(tracked_bet)
    await db.commit()
    await db.refresh(tracked_bet)

    return {
        "id": tracked_bet.id,
        "tracked_at": tracked_bet.tracked_at.isoformat(),
        "status": "pending",
    }


@router.delete("/tracked-bets/{bet_id}")
async def delete_tracked_bet(
    bet_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_required),
) -> dict:
    """Delete a tracked bet."""
    result = await db.execute(
        select(TrackedBet)
        .where(TrackedBet.id == bet_id)
        .where(TrackedBet.user_id == current_user.id)
    )
    bet = result.scalar_one_or_none()

    if not bet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracked bet not found",
        )

    await db.delete(bet)
    await db.commit()

    return {"success": True}


@router.post("/favorites")
async def manage_favorite(
    request: FavoriteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_required),
) -> dict:
    """Add or remove a favorite."""
    if request.action == "add":
        # Check if already exists
        existing = await db.execute(
            select(Favorite)
            .where(Favorite.user_id == current_user.id)
            .where(Favorite.entity_type == request.entity_type)
            .where(Favorite.entity_id == request.entity_id)
        )
        if existing.scalar_one_or_none():
            # Already exists, return success
            count_result = await db.execute(
                select(func.count(Favorite.id)).where(Favorite.user_id == current_user.id)
            )
            count = count_result.scalar()
            return {"success": True, "favorites_count": count}

        favorite = Favorite(
            user_id=current_user.id,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
        )
        db.add(favorite)
        await db.commit()

    elif request.action == "remove":
        result = await db.execute(
            select(Favorite)
            .where(Favorite.user_id == current_user.id)
            .where(Favorite.entity_type == request.entity_type)
            .where(Favorite.entity_id == request.entity_id)
        )
        favorite = result.scalar_one_or_none()
        if favorite:
            await db.delete(favorite)
            await db.commit()

    # Get updated count
    count_result = await db.execute(
        select(func.count(Favorite.id)).where(Favorite.user_id == current_user.id)
    )
    count = count_result.scalar()

    return {"success": True, "favorites_count": count}


@router.get("/favorites")
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_required),
) -> dict:
    """Get user's favorites."""
    result = await db.execute(
        select(Favorite)
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
    )
    favorites = result.scalars().all()

    formatted = []
    for fav in favorites:
        formatted.append({
            "id": fav.id,
            "entity_type": fav.entity_type,
            "entity_id": fav.entity_id,
            "created_at": fav.created_at.isoformat() if fav.created_at else None,
        })

    return {"favorites": formatted}


@router.get("/settings")
async def get_settings(
    current_user: User = Depends(get_current_user_required),
) -> dict:
    """Get user settings."""
    return {
        "email": current_user.email,
        "preferred_books": current_user.preferred_books or [],
        "odds_format": current_user.odds_format or "american",
    }


@router.patch("/settings")
async def update_settings(
    preferred_books: Optional[list[str]] = None,
    odds_format: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_required),
) -> dict:
    """Update user settings."""
    if preferred_books is not None:
        current_user.preferred_books = preferred_books
    if odds_format is not None:
        current_user.odds_format = odds_format

    await db.commit()
    await db.refresh(current_user)

    return {
        "email": current_user.email,
        "preferred_books": current_user.preferred_books or [],
        "odds_format": current_user.odds_format or "american",
    }
