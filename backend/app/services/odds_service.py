"""Odds data service with mock and real provider support."""
import json
from abc import ABC, abstractmethod
from datetime import datetime, date
from typing import Optional
import httpx

from app.core.config import get_settings

settings = get_settings()


class OddsProvider(ABC):
    """Abstract base class for odds providers."""

    @abstractmethod
    async def get_lines(
        self,
        game_date: date,
        market: Optional[str] = None,
        book: Optional[str] = None,
        team: Optional[str] = None,
    ) -> dict:
        """Get betting lines for a given date."""
        pass

    @abstractmethod
    async def get_player_props(self, game_id: str) -> list[dict]:
        """Get player props for a specific game."""
        pass


class MockOddsProvider(OddsProvider):
    """Mock odds provider with realistic sample data."""

    def __init__(self):
        self.mock_games = self._generate_mock_data()

    def _generate_mock_data(self) -> dict:
        """Generate realistic mock betting data."""
        return {
            "games": [
                {
                    "game_id": "0022400385",
                    "home_team": {"id": "BOS", "name": "Boston Celtics"},
                    "away_team": {"id": "LAL", "name": "Los Angeles Lakers"},
                    "scheduled_time": "2024-12-15T19:30:00Z",
                    "game_lines": [
                        {
                            "book": "draftkings",
                            "spread": {"home": -4.5, "home_odds": -110, "away_odds": -110},
                            "total": {"line": 224.5, "over_odds": -110, "under_odds": -110},
                            "home_team_total": {"line": 114.5, "over_odds": -110, "under_odds": -110},
                            "away_team_total": {"line": 110.0, "over_odds": -110, "under_odds": -110},
                        },
                        {
                            "book": "fanduel",
                            "spread": {"home": -4.5, "home_odds": -108, "away_odds": -112},
                            "total": {"line": 224.0, "over_odds": -110, "under_odds": -110},
                            "home_team_total": {"line": 114.5, "over_odds": -112, "under_odds": -108},
                            "away_team_total": {"line": 110.5, "over_odds": -108, "under_odds": -112},
                        },
                    ],
                    "player_props": [
                        {
                            "player": {"id": 2544, "name": "LeBron James", "team": "LAL"},
                            "props": [
                                {"book": "draftkings", "stat": "points", "line": 25.5, "over_odds": -110, "under_odds": -110},
                                {"book": "draftkings", "stat": "rebounds", "line": 7.5, "over_odds": -115, "under_odds": -105},
                                {"book": "draftkings", "stat": "assists", "line": 7.5, "over_odds": -120, "under_odds": +100},
                                {"book": "fanduel", "stat": "points", "line": 25.5, "over_odds": -108, "under_odds": -112},
                                {"book": "fanduel", "stat": "rebounds", "line": 7.5, "over_odds": -110, "under_odds": -110},
                                {"book": "fanduel", "stat": "assists", "line": 8.5, "over_odds": +100, "under_odds": -120},
                            ],
                        },
                        {
                            "player": {"id": 203076, "name": "Anthony Davis", "team": "LAL"},
                            "props": [
                                {"book": "draftkings", "stat": "points", "line": 24.5, "over_odds": -110, "under_odds": -110},
                                {"book": "draftkings", "stat": "rebounds", "line": 11.5, "over_odds": -105, "under_odds": -115},
                                {"book": "draftkings", "stat": "blocks", "line": 2.5, "over_odds": +120, "under_odds": -140},
                                {"book": "fanduel", "stat": "points", "line": 24.5, "over_odds": -112, "under_odds": -108},
                                {"book": "fanduel", "stat": "rebounds", "line": 11.5, "over_odds": -110, "under_odds": -110},
                            ],
                        },
                        {
                            "player": {"id": 1628369, "name": "Jayson Tatum", "team": "BOS"},
                            "props": [
                                {"book": "draftkings", "stat": "points", "line": 27.5, "over_odds": -115, "under_odds": -105},
                                {"book": "draftkings", "stat": "rebounds", "line": 8.5, "over_odds": -110, "under_odds": -110},
                                {"book": "draftkings", "stat": "assists", "line": 5.5, "over_odds": -105, "under_odds": -115},
                                {"book": "fanduel", "stat": "points", "line": 28.5, "over_odds": +100, "under_odds": -120},
                                {"book": "fanduel", "stat": "rebounds", "line": 8.5, "over_odds": -108, "under_odds": -112},
                            ],
                        },
                        {
                            "player": {"id": 1628991, "name": "Jaylen Brown", "team": "BOS"},
                            "props": [
                                {"book": "draftkings", "stat": "points", "line": 22.5, "over_odds": -110, "under_odds": -110},
                                {"book": "draftkings", "stat": "rebounds", "line": 5.5, "over_odds": -115, "under_odds": -105},
                                {"book": "fanduel", "stat": "points", "line": 23.5, "over_odds": -105, "under_odds": -115},
                            ],
                        },
                    ],
                },
                {
                    "game_id": "0022400386",
                    "home_team": {"id": "GSW", "name": "Golden State Warriors"},
                    "away_team": {"id": "PHX", "name": "Phoenix Suns"},
                    "scheduled_time": "2024-12-15T22:00:00Z",
                    "game_lines": [
                        {
                            "book": "draftkings",
                            "spread": {"home": -2.5, "home_odds": -110, "away_odds": -110},
                            "total": {"line": 228.5, "over_odds": -110, "under_odds": -110},
                            "home_team_total": {"line": 115.5, "over_odds": -110, "under_odds": -110},
                            "away_team_total": {"line": 113.0, "over_odds": -110, "under_odds": -110},
                        },
                    ],
                    "player_props": [
                        {
                            "player": {"id": 201142, "name": "Kevin Durant", "team": "PHX"},
                            "props": [
                                {"book": "draftkings", "stat": "points", "line": 28.5, "over_odds": -110, "under_odds": -110},
                                {"book": "draftkings", "stat": "rebounds", "line": 6.5, "over_odds": -105, "under_odds": -115},
                                {"book": "draftkings", "stat": "assists", "line": 5.5, "over_odds": -110, "under_odds": -110},
                            ],
                        },
                        {
                            "player": {"id": 201939, "name": "Stephen Curry", "team": "GSW"},
                            "props": [
                                {"book": "draftkings", "stat": "points", "line": 26.5, "over_odds": -115, "under_odds": -105},
                                {"book": "draftkings", "stat": "threes", "line": 4.5, "over_odds": -105, "under_odds": -115},
                                {"book": "draftkings", "stat": "assists", "line": 6.5, "over_odds": -110, "under_odds": -110},
                            ],
                        },
                        {
                            "player": {"id": 1626164, "name": "Devin Booker", "team": "PHX"},
                            "props": [
                                {"book": "draftkings", "stat": "points", "line": 25.5, "over_odds": -110, "under_odds": -110},
                                {"book": "draftkings", "stat": "assists", "line": 6.5, "over_odds": +100, "under_odds": -120},
                            ],
                        },
                    ],
                },
                {
                    "game_id": "0022400387",
                    "home_team": {"id": "DEN", "name": "Denver Nuggets"},
                    "away_team": {"id": "MIL", "name": "Milwaukee Bucks"},
                    "scheduled_time": "2024-12-15T21:00:00Z",
                    "game_lines": [
                        {
                            "book": "draftkings",
                            "spread": {"home": -3.5, "home_odds": -110, "away_odds": -110},
                            "total": {"line": 232.5, "over_odds": -110, "under_odds": -110},
                            "home_team_total": {"line": 118.0, "over_odds": -110, "under_odds": -110},
                            "away_team_total": {"line": 114.5, "over_odds": -110, "under_odds": -110},
                        },
                    ],
                    "player_props": [
                        {
                            "player": {"id": 203999, "name": "Nikola Jokic", "team": "DEN"},
                            "props": [
                                {"book": "draftkings", "stat": "points", "line": 26.5, "over_odds": -110, "under_odds": -110},
                                {"book": "draftkings", "stat": "rebounds", "line": 12.5, "over_odds": -105, "under_odds": -115},
                                {"book": "draftkings", "stat": "assists", "line": 9.5, "over_odds": -110, "under_odds": -110},
                            ],
                        },
                        {
                            "player": {"id": 203507, "name": "Giannis Antetokounmpo", "team": "MIL"},
                            "props": [
                                {"book": "draftkings", "stat": "points", "line": 30.5, "over_odds": -105, "under_odds": -115},
                                {"book": "draftkings", "stat": "rebounds", "line": 11.5, "over_odds": -110, "under_odds": -110},
                                {"book": "draftkings", "stat": "assists", "line": 6.5, "over_odds": -115, "under_odds": -105},
                            ],
                        },
                    ],
                },
            ]
        }

    async def get_lines(
        self,
        game_date: date,
        market: Optional[str] = None,
        book: Optional[str] = None,
        team: Optional[str] = None,
    ) -> dict:
        """Get mock betting lines."""
        games = self.mock_games["games"]

        # Filter by team if specified
        if team:
            games = [
                g for g in games
                if g["home_team"]["id"] == team or g["away_team"]["id"] == team
            ]

        # Filter by book if specified
        if book:
            for game in games:
                game["game_lines"] = [
                    gl for gl in game["game_lines"]
                    if gl["book"] == book
                ]
                for pp in game["player_props"]:
                    pp["props"] = [
                        p for p in pp["props"]
                        if p["book"] == book
                    ]

        # Filter by market type if specified
        if market:
            if market == "player_prop":
                for game in games:
                    game["game_lines"] = []
            else:
                for game in games:
                    game["player_props"] = []

        return {
            "date": game_date.isoformat(),
            "games": games,
        }

    async def get_player_props(self, game_id: str) -> list[dict]:
        """Get player props for a specific game."""
        for game in self.mock_games["games"]:
            if game["game_id"] == game_id:
                return game["player_props"]
        return []


class TheOddsApiProvider(OddsProvider):
    """Real odds provider using The Odds API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.the-odds-api.com/v4"

    async def get_lines(
        self,
        game_date: date,
        market: Optional[str] = None,
        book: Optional[str] = None,
        team: Optional[str] = None,
    ) -> dict:
        """Get betting lines from The Odds API."""
        async with httpx.AsyncClient() as client:
            # Get odds for NBA
            params = {
                "apiKey": self.api_key,
                "regions": "us",
                "markets": "spreads,totals,player_points,player_rebounds,player_assists",
                "oddsFormat": "american",
            }

            response = await client.get(
                f"{self.base_url}/sports/basketball_nba/odds",
                params=params,
            )
            response.raise_for_status()

            data = response.json()

            # Transform to our format
            games = []
            for event in data:
                game = {
                    "game_id": event["id"],
                    "home_team": {"id": self._team_abbrev(event["home_team"]), "name": event["home_team"]},
                    "away_team": {"id": self._team_abbrev(event["away_team"]), "name": event["away_team"]},
                    "scheduled_time": event["commence_time"],
                    "game_lines": [],
                    "player_props": [],
                }

                for bookmaker in event.get("bookmakers", []):
                    if book and bookmaker["key"] != book:
                        continue

                    game_line = {"book": bookmaker["key"]}

                    for market_data in bookmaker.get("markets", []):
                        if market_data["key"] == "spreads":
                            for outcome in market_data["outcomes"]:
                                if outcome["name"] == event["home_team"]:
                                    game_line["spread"] = {
                                        "home": outcome["point"],
                                        "home_odds": outcome["price"],
                                        "away_odds": -110,  # Simplified
                                    }
                        elif market_data["key"] == "totals":
                            for outcome in market_data["outcomes"]:
                                if outcome["name"] == "Over":
                                    game_line["total"] = {
                                        "line": outcome["point"],
                                        "over_odds": outcome["price"],
                                        "under_odds": -110,
                                    }

                    if game_line.get("spread") or game_line.get("total"):
                        game["game_lines"].append(game_line)

                games.append(game)

            return {"date": game_date.isoformat(), "games": games}

    async def get_player_props(self, game_id: str) -> list[dict]:
        """Get player props from The Odds API."""
        # The Odds API requires separate calls for player props
        # Implementation would follow similar pattern
        return []

    def _team_abbrev(self, team_name: str) -> str:
        """Convert team name to abbreviation."""
        abbrevs = {
            "Los Angeles Lakers": "LAL",
            "Boston Celtics": "BOS",
            "Golden State Warriors": "GSW",
            "Phoenix Suns": "PHX",
            "Denver Nuggets": "DEN",
            "Milwaukee Bucks": "MIL",
            # Add more as needed
        }
        return abbrevs.get(team_name, team_name[:3].upper())


class OddsService:
    """Service for fetching and managing odds data."""

    def __init__(self, provider: Optional[OddsProvider] = None):
        if provider:
            self.provider = provider
        elif settings.odds_api_key:
            self.provider = TheOddsApiProvider(settings.odds_api_key)
        else:
            self.provider = MockOddsProvider()

    async def get_lines(
        self,
        game_date: date,
        market: Optional[str] = None,
        book: Optional[str] = None,
        team: Optional[str] = None,
    ) -> dict:
        """Get betting lines for a given date."""
        return await self.provider.get_lines(game_date, market, book, team)

    async def get_player_props(self, game_id: str) -> list[dict]:
        """Get player props for a specific game."""
        return await self.provider.get_player_props(game_id)

    async def get_line_for_analysis(
        self,
        player_id: int,
        game_id: str,
        stat: str,
    ) -> Optional[dict]:
        """Get specific line for analysis."""
        props = await self.provider.get_player_props(game_id)
        for player_props in props:
            if player_props["player"]["id"] == player_id:
                for prop in player_props["props"]:
                    if prop["stat"] == stat:
                        return prop
        return None
