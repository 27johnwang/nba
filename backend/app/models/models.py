"""SQLAlchemy database models."""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    preferred_books = Column(ARRAY(Text), default=[])
    odds_format = Column(String(20), default="american")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    tracked_bets = relationship("TrackedBet", back_populates="user", cascade="all, delete-orphan")


class Team(Base):
    """NBA team model."""

    __tablename__ = "teams"

    id = Column(String(10), primary_key=True)  # e.g., 'LAL', 'BOS'
    name = Column(String(100), nullable=False)
    conference = Column(String(10))
    division = Column(String(20))

    players = relationship("Player", back_populates="team")
    home_games = relationship("Game", foreign_keys="Game.home_team_id", back_populates="home_team")
    away_games = relationship("Game", foreign_keys="Game.away_team_id", back_populates="away_team")


class Player(Base):
    """NBA player model."""

    __tablename__ = "players"

    id = Column(Integer, primary_key=True)  # NBA player ID
    name = Column(String(100), nullable=False, index=True)
    team_id = Column(String(10), ForeignKey("teams.id"))
    position = Column(String(10))
    is_active = Column(Boolean, default=True)

    team = relationship("Team", back_populates="players")
    game_stats = relationship("PlayerGameStats", back_populates="player")


class Game(Base):
    """NBA game model."""

    __tablename__ = "games"

    id = Column(String(20), primary_key=True)  # e.g., '0022400123'
    date = Column(DateTime, nullable=False, index=True)
    home_team_id = Column(String(10), ForeignKey("teams.id"))
    away_team_id = Column(String(10), ForeignKey("teams.id"))
    scheduled_time = Column(DateTime)
    status = Column(String(20), default="scheduled")  # scheduled, live, final
    home_score = Column(Integer)
    away_score = Column(Integer)
    season = Column(String(10))  # '2024-25'

    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_games")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_games")
    player_stats = relationship("PlayerGameStats", back_populates="game")
    team_stats = relationship("TeamGameStats", back_populates="game")
    odds_snapshots = relationship("OddsSnapshot", back_populates="game")

    __table_args__ = (
        Index("idx_games_teams", "home_team_id", "away_team_id"),
    )


class PlayerGameStats(Base):
    """Player statistics for a single game."""

    __tablename__ = "player_game_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"), index=True)
    game_id = Column(String(20), ForeignKey("games.id"), index=True)
    team_id = Column(String(10), ForeignKey("teams.id"))
    minutes = Column(Numeric(5, 2))
    points = Column(Integer)
    rebounds = Column(Integer)
    assists = Column(Integer)
    steals = Column(Integer)
    blocks = Column(Integer)
    turnovers = Column(Integer)
    three_pointers_made = Column(Integer)
    three_pointers_attempted = Column(Integer)
    field_goals_made = Column(Integer)
    field_goals_attempted = Column(Integer)
    free_throws_made = Column(Integer)
    free_throws_attempted = Column(Integer)
    plus_minus = Column(Integer)
    is_starter = Column(Boolean)

    player = relationship("Player", back_populates="game_stats")
    game = relationship("Game", back_populates="player_stats")

    __table_args__ = (
        UniqueConstraint("player_id", "game_id", name="uq_player_game"),
        Index("idx_player_stats_player_game", "player_id", "game_id"),
    )


class TeamGameStats(Base):
    """Team statistics for a single game."""

    __tablename__ = "team_game_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String(10), ForeignKey("teams.id"), index=True)
    game_id = Column(String(20), ForeignKey("games.id"), index=True)
    opponent_id = Column(String(10), ForeignKey("teams.id"))
    is_home = Column(Boolean)
    points = Column(Integer)
    rebounds = Column(Integer)
    assists = Column(Integer)
    pace = Column(Numeric(5, 2))
    offensive_rating = Column(Numeric(6, 2))
    defensive_rating = Column(Numeric(6, 2))

    team = relationship("Team", foreign_keys=[team_id])
    game = relationship("Game", back_populates="team_stats")

    __table_args__ = (
        UniqueConstraint("team_id", "game_id", name="uq_team_game"),
    )


class OddsSnapshot(Base):
    """Betting odds snapshot from sportsbooks."""

    __tablename__ = "odds_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String(20), ForeignKey("games.id"), index=True)
    book_id = Column(String(20), nullable=False)  # 'draftkings', 'fanduel'
    market_type = Column(String(30), nullable=False)  # 'spread', 'total', 'player_prop'
    prop_type = Column(String(30))  # 'points', 'rebounds', etc.
    player_id = Column(Integer, ForeignKey("players.id"), index=True)
    line_value = Column(Numeric(6, 2), nullable=False)
    over_odds = Column(Integer)  # American odds
    under_odds = Column(Integer)
    home_odds = Column(Integer)
    away_odds = Column(Integer)
    captured_at = Column(DateTime, default=datetime.utcnow, index=True)

    game = relationship("Game", back_populates="odds_snapshots")
    player = relationship("Player")

    __table_args__ = (
        Index("idx_odds_market", "market_type", "prop_type"),
    )


class ComputedFeature(Base):
    """Pre-computed statistical features for analysis."""

    __tablename__ = "computed_features"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"), index=True)
    stat_type = Column(String(30), nullable=False)
    window_type = Column(String(20), nullable=False)  # 'L10', 'L20', 'season'
    opponent_id = Column(String(10), ForeignKey("teams.id"))
    home_away = Column(String(10))  # 'home', 'away', NULL

    average = Column(Numeric(6, 2))
    median = Column(Numeric(6, 2))
    std_dev = Column(Numeric(6, 2))
    min_val = Column(Integer)
    max_val = Column(Integer)
    games_played = Column(Integer)
    distribution = Column(JSONB)  # {"0-10": 2, "11-20": 5, ...}

    computed_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player")

    __table_args__ = (
        UniqueConstraint(
            "player_id", "stat_type", "window_type", "opponent_id", "home_away",
            name="uq_computed_feature"
        ),
        Index("idx_features_lookup", "player_id", "stat_type", "window_type"),
    )


class Favorite(Base):
    """User's saved favorites."""

    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    entity_type = Column(String(20), nullable=False)  # 'player', 'team', 'market'
    entity_id = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "entity_type", "entity_id", name="uq_user_favorite"),
    )


class TrackedBet(Base):
    """User's manually tracked bets."""

    __tablename__ = "tracked_bets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    game_id = Column(String(20), ForeignKey("games.id"), index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    market_type = Column(String(30), nullable=False)
    prop_type = Column(String(30))
    line_value = Column(Numeric(6, 2), nullable=False)
    bet_side = Column(String(10), nullable=False)  # 'over', 'under', 'home', 'away'
    odds = Column(Integer)

    actual_value = Column(Numeric(6, 2))
    result = Column(String(10))  # 'won', 'lost', 'push', NULL if pending

    tracked_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)

    user = relationship("User", back_populates="tracked_bets")
    game = relationship("Game")
    player = relationship("Player")

    __table_args__ = (
        Index("idx_tracked_pending", "user_id", "result"),
    )


class Analysis(Base):
    """Cached LLM analysis results."""

    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    game_id = Column(String(20), ForeignKey("games.id"))
    stat_type = Column(String(30), nullable=False)
    line_value = Column(Numeric(6, 2), nullable=False)

    analysis_json = Column(JSONB, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

    player = relationship("Player")
    game = relationship("Game")

    __table_args__ = (
        Index("idx_analyses_lookup", "player_id", "game_id", "stat_type", "line_value"),
        Index("idx_analyses_expires", "expires_at"),
    )
