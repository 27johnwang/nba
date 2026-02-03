# NBA Betting Analytics App — Full Design Specification

---

## 1) PRODUCT DEFINITION

### Target User Persona

**"Sharp Casual" Sports Bettor**
- Age 25–40, bets 3–10x per week on NBA
- Uses 1–2 sportsbooks (DraftKings, FanDuel, BetMGM)
- Wants data-driven confidence, not gut picks
- Time-constrained: needs answers in <30 seconds per bet
- Already has a line in mind—wants validation/context, not discovery

### Core Value Proposition

**"Bet-First, Not Stat-First"**

Traditional sports analytics apps show mountains of stats and expect users to find value. This app flips the model:

1. User selects a specific betting line (e.g., "LeBron Over 7.5 assists -115")
2. App instantly shows hit rate, averages, and context for THAT line
3. User gets a neutral, data-backed assessment in seconds

### Key User Flows

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW 1: Line Analysis (Primary)                             │
├─────────────────────────────────────────────────────────────┤
│ 1. Open app → Lines tab (today's lines by default)          │
│ 2. Filter by: Book / Market type / Team / Player            │
│ 3. Tap any line → Navigate to Analyze screen                │
│ 4. View essential stats (L10 avg, hit rate, season avg)     │
│ 5. Expand sections for deeper context                       │
│ 6. Optional: Save to tracker / favorites                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FLOW 2: Quick Search                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Tap search icon (any tab)                                │
│ 2. Type player/team name                                    │
│ 3. See available lines for that entity                      │
│ 4. Tap line → Analyze                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FLOW 3: Track & Review                                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Profile tab → Tracked bets                               │
│ 2. See saved analyses with outcomes (W/L/Push)              │
│ 3. Filter by date range, market type                        │
│ 4. View historical accuracy of tracked picks                │
└─────────────────────────────────────────────────────────────┘
```

### Non-Goals

- ❌ **No betting recommendations** — App shows data, user decides
- ❌ **No guaranteed picks or "locks"** — Neutral language only
- ❌ **No real-money transactions** — Analytics only, no sportsbook integration
- ❌ **No social/community features (MVP)** — Focus on individual analysis
- ❌ **No live in-game betting analytics (MVP)** — Pre-game only

---

## 2) INFORMATION ARCHITECTURE & NAV

### Bottom Navigation (4 Tabs)

```
┌────────────┬────────────┬────────────┬────────────┐
│   Lines    │  Analyze   │   Trends   │  Profile   │
│     📋     │     📊     │     📈     │     👤     │
└────────────┴────────────┴────────────┴────────────┘
```

| Tab | Purpose | Primary Actions |
|-----|---------|-----------------|
| **Lines** | Browse today's betting lines across books/markets | Filter, Search, Tap to analyze |
| **Analyze** | Deep-dive on a selected line (or manual entry) | View metrics, Expand sections, Save |
| **Trends** | League-wide and player trends (hot/cold streaks) | Browse trends, Tap player to see lines |
| **Profile** | Saved favorites, tracked bets, settings | View history, Manage favorites, Settings |

### Global Elements

- **Search** (magnifying glass, top-right): Accessible from any tab
- **Date selector** (Lines tab): Defaults to today, can view tomorrow
- **Disclaimer footer**: "For informational purposes only. Please bet responsibly."

---

## 3) UI SPEC (SCREEN-BY-SCREEN)

### 3.1 Lines Screen

**Purpose**: Browse available betting lines, filter to find specific bets

```
┌─────────────────────────────────────────┐
│ [Today ▼]              [🔍]             │  ← Date picker + Search
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [All] [Props] [Spreads] [Totals]    │ │  ← Market type pills
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [All Books▼] [All Teams▼]           │ │  ← Filter dropdowns
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ LAL @ BOS · 7:30 PM                 │ │  ← Game header
│ ├─────────────────────────────────────┤ │
│ │ LeBron James                        │ │
│ │ Points    O 25.5  -110  │ U -110    │ │  ← Line row (tappable)
│ │ Assists   O 7.5   -115  │ U -105    │ │
│ │ Rebounds  O 7.5   +100  │ U -120    │ │
│ ├─────────────────────────────────────┤ │
│ │ Anthony Davis                       │ │
│ │ Points    O 24.5  -110  │ U -110    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Game Lines                          │ │
│ │ Spread    LAL +4.5  -110            │ │
│ │ Total     O 224.5  -110             │ │
│ │ LAL TT    O 110.5  -110             │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**UI Components**:
- **Date Picker**: Dropdown, options: Today, Tomorrow
- **Market Pills**: Horizontal scroll, single-select (All, Props, Spreads, Totals, Team Totals)
- **Filter Dropdowns**: Multi-select for books, single-select for teams
- **Game Card**: Grouped by game, sorted by tip-off time
- **Line Row**: Tap entire row → Analyze screen; shows O/U with odds

**Interaction Rules**:
- Tap line row → Navigate to Analyze with line pre-loaded
- Long-press line → Quick add to favorites
- Pull-to-refresh → Reload lines

**States**:
- **Loading**: Skeleton cards with shimmer
- **Empty**: "No lines available for selected filters"
- **Error**: "Unable to load lines. Pull to retry."

---

### 3.2 Analyze Screen (CRITICAL)

**Purpose**: Show essential data first for selected line, then collapsible deep context

```
┌─────────────────────────────────────────┐
│ ← Back                    [☆ Save]      │
├─────────────────────────────────────────┤
│                                         │
│   LeBron James · Points                 │  ← Player + Stat
│   ┌─────────────────────────────────┐   │
│   │      OVER 25.5  (-110)          │   │  ← Selected line (pill)
│   └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ ▸ ESSENTIAL STATS                       │  ← Always expanded
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │  L10 Average        27.3 pts       │ │
│ │  Season Average     25.8 pts       │ │
│ │  Season Median      26.0 pts       │ │
│ │                                     │ │
│ │  ────────────────────────────────  │ │
│ │                                     │ │
│ │  Hit Rate (L10)     7/10  (70%)    │ │
│ │  Hit Rate (Season)  38/52 (73%)    │ │
│ │                                     │ │
│ │  [L10] [L20] [Season]  ← Toggle    │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ▾ WHAT NEEDS TO HAPPEN                  │  ← Collapsible
│ ┌─────────────────────────────────────┐ │
│ │ LeBron needs to exceed his L10     │ │
│ │ average by ~0 points. He's hit     │ │
│ │ this in 7 of last 10 games.        │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ▸ RECENT VS BASELINE                    │  ← Collapsible (collapsed)
├─────────────────────────────────────────┤
│ ▸ MATCHUP CONTEXT                       │  ← Collapsible (collapsed)
├─────────────────────────────────────────┤
│ ▸ VOLATILITY FLAGS                      │  ← Collapsible (collapsed)
├─────────────────────────────────────────┤
│ ▾ BOTTOM LINE                           │  ← Collapsible
│ ┌─────────────────────────────────────┐ │
│ │ LeBron's recent production aligns  │ │
│ │ with this line. The matchup vs BOS │ │
│ │ is neutral—he's averaged 26.2 in   │ │
│ │ 3 games vs them this season.       │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│                                         │
│  [Track This Bet]                       │  ← CTA button
│                                         │
└─────────────────────────────────────────┘

--- DISCLAIMER (sticky footer) ---
"Analytics only. Not betting advice."
```

**Essential Stats Section (Always Visible)**:

| Metric | Definition |
|--------|------------|
| L10 Average | Mean of stat over last 10 games |
| Season Average | Mean of stat over all games this season |
| Season Median | Middle value of stat distribution |
| Hit Rate (L10) | Games over line / 10 |
| Hit Rate (Season) | Games over line / total games |

**Toggle**: L10 / L20 / Season changes the "recent" window for averages

**Collapsible Sections**:

1. **What Needs to Happen** (LLM-generated)
   - 1–2 sentences comparing line to recent performance
   - Plain English, no jargon

2. **Recent vs Baseline**
   - L10 avg vs Season avg comparison
   - Trend indicator (↑ trending up, ↓ trending down, → stable)
   - Recent games mini-chart (last 5 as dots above/below line)

3. **Matchup Context**
   - Opponent stats (e.g., "BOS allows 24.2 PPG to SFs, 5th most")
   - H2H this season (if available)
   - Home/Away split for this stat

4. **Volatility Flags** (LLM-generated explanations)
   - ⚠️ Minutes volatility (std dev > 4 min)
   - ⚠️ Blowout risk (spread > 8)
   - ⚠️ Role change (starter/bench change)
   - ⚠️ Injury impact (key teammate out)
   - ⚠️ Back-to-back game

5. **Bottom Line** (LLM-generated)
   - 2–3 sentence neutral summary
   - Never recommends bet/no-bet

**Interaction Rules**:
- Tap section header → Expand/collapse
- Tap "Track This Bet" → Add to Profile tracker
- Tap star → Add player to favorites
- Swipe left → Next line for same player (if multiple)

**States**:
- **Loading**: Essential stats skeleton, sections show "Analyzing..."
- **Empty**: "No data available for this player/stat"
- **Error**: "Analysis failed. Tap to retry."
- **Partial**: Show available data, gray out missing sections

---

### 3.3 Trends Screen

**Purpose**: Surface league-wide trends and streaks

```
┌─────────────────────────────────────────┐
│ Trends                      [🔍]        │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [Hot Streaks] [Cold] [Consistent]   │ │  ← Trend type pills
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│                                         │
│ 🔥 HOT STREAKS (Last 10 Games)         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Tyrese Maxey · Points               │ │
│ │ Hit 9/10 overs at 23.5 line         │ │
│ │ L10 Avg: 28.4 (Season: 25.1)        │ │
│ │                              [→]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Domantas Sabonis · Rebounds         │ │
│ │ Hit 10/10 overs at 12.5 line        │ │
│ │ L10 Avg: 14.2 (Season: 13.1)        │ │
│ │                              [→]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ❄️ COLD STREAKS                         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Zion Williamson · Points            │ │
│ │ Hit 2/10 overs at 24.5 line         │ │
│ │ L10 Avg: 21.3 (Season: 24.8)        │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**UI Components**:
- **Trend Pills**: Hot Streaks, Cold Streaks, Most Consistent
- **Trend Cards**: Player, stat, hit rate, avg comparison
- **Arrow button**: Tap to see lines for that player

**Interaction Rules**:
- Tap card → View available lines for that player
- Pull-to-refresh → Recalculate trends

---

### 3.4 Profile Screen

**Purpose**: Manage tracked bets, favorites, settings

```
┌─────────────────────────────────────────┐
│ Profile                                 │
├─────────────────────────────────────────┤
│                                         │
│ TRACKED BETS                            │
│ ┌─────────────────────────────────────┐ │
│ │ Today: 2 pending                    │ │
│ │ This Week: 8-5-1 (W-L-P)           │ │
│ │                          [See All]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ LeBron O 25.5 pts · LAL@BOS        │ │
│ │ Tracked 2h ago · ⏳ Pending         │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Jaylen Brown O 22.5 pts · LAL@BOS  │ │
│ │ Tracked 1h ago · ⏳ Pending         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ FAVORITES                               │
│ ┌─────────────────────────────────────┐ │
│ │ ⭐ LeBron James                     │ │
│ │ ⭐ Boston Celtics                   │ │
│ │ ⭐ Assists props                    │ │
│ │                          [Manage]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ SETTINGS                                │
│ ┌─────────────────────────────────────┐ │
│ │ Preferred Books    [DK, FD]         │ │
│ │ Odds Format        [American]       │ │
│ │ Notifications      [On]             │ │
│ │ Responsible Gaming [→]              │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Tracked Bets States**:
- ⏳ Pending (game not started)
- ✅ Won (stat exceeded line)
- ❌ Lost (stat under line)
- ➖ Push (stat equals line)

---

## 4) DATA REQUIREMENTS

### A) Odds/Lines Data

| Data Point | Description | Refresh Rate |
|------------|-------------|--------------|
| `market_type` | spread, total, team_total, player_prop | — |
| `prop_type` | points, rebounds, assists, 3pm, etc. | — |
| `line_value` | The number (e.g., 25.5) | 5 min |
| `over_odds` | American odds for over (-110) | 5 min |
| `under_odds` | American odds for under (-110) | 5 min |
| `book_id` | Sportsbook identifier | — |
| `game_id` | Associated game | — |
| `player_id` | For player props | — |
| `timestamp` | When odds were captured | — |

**Realistic Odds Sources**:

1. **The Odds API** (theoddsapi.com) — $79–499/mo, covers major books
2. **OddsJam API** — Aggregator with prop coverage
3. **Action Network API** (if licensed)
4. **Direct sportsbook partnerships** (enterprise)

**Abstraction**: Create `OddsProvider` interface to swap sources:

```typescript
interface OddsProvider {
  getLines(date: string, market?: string): Promise<Line[]>;
  getPlayerProps(gameId: string): Promise<PlayerProp[]>;
  getGameOdds(gameId: string): Promise<GameOdds>;
}
```

### B) NBA Stats Data

| Data Point | Source | Refresh Rate |
|------------|--------|--------------|
| Player game logs | NBA API / basketball-reference | Post-game |
| Team game logs | NBA API | Post-game |
| Schedule | NBA API | Daily |
| Pace (possessions/game) | Calculated | Post-game |
| ORtg / DRtg | NBA API / calculated | Post-game |
| Opponent splits | Calculated | Post-game |
| Home/Away splits | Calculated | Post-game |
| Minutes played | NBA API | Post-game |

**NBA Data Sources**:

1. **nba_api** (Python) — Unofficial but reliable
2. **balldontlie.io** — Free tier available
3. **SportsRadar** (enterprise) — Official NBA partner
4. **Basketball-Reference** (scraping w/ attribution)

### C) Context Data

| Data Point | Source | Notes |
|------------|--------|-------|
| Rest days | Calculated from schedule | 0 = back-to-back |
| Injuries | ESPN API / RotoWire | Best-effort |
| Starting lineups | RotoWire / official | Pre-game only |
| Referee assignments | NBA official | Optional V2 |

### Missing Data Handling

| Missing Data | Fallback |
|--------------|----------|
| Odds for specific book | Show available books only |
| Player game logs | "Insufficient data" message |
| Opponent stats | Omit matchup section |
| Injuries | Show "Injury data unavailable" |
| Lineups | Assume recent starters |

---

## 5) SYSTEM ARCHITECTURE

### Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Mobile Web  │  │   iOS App    │  │ Android App  │          │
│  │   (React)    │  │(React Native)│  │(React Native)│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          └────────────────┼─────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / CDN                          │
│                    (Cloudflare / Vercel)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                │
│                   (FastAPI + Python)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /lines    /analyze    /player    /trends    /profile   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Redis     │     │  Postgres   │     │   LLM API   │      │
│  │   Cache     │     │   (Data)    │     │  (Claude)   │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                     BACKGROUND JOBS                             │
│                    (Celery + Redis)                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Odds Ingestion (every 5 min)                         │   │
│  │  • Stats Refresh (post-game)                            │   │
│  │  • Feature Computation (post-game)                      │   │
│  │  • Trend Calculation (hourly)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Odds API    │  │   NBA API    │  │  Injury API  │          │
│  │ (The Odds)   │  │  (nba_api)   │  │  (RotoWire)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Client** | React (web) / React Native (mobile) | UI rendering |
| **API Gateway** | Cloudflare / Nginx | Rate limiting, SSL, caching |
| **Backend API** | FastAPI (Python 3.11+) | Business logic, API endpoints |
| **Database** | PostgreSQL 15 | Persistent data storage |
| **Cache** | Redis 7 | Odds cache, session cache, rate limiting |
| **Job Queue** | Celery + Redis | Background data ingestion |
| **LLM** | Claude API (Anthropic) | Analysis text generation |
| **Observability** | Datadog / Grafana + Loki | Metrics, logs, traces |

### Observability Basics

- **Structured logging**: JSON logs with request_id, user_id, latency
- **Metrics**: Request count, latency p50/p95/p99, error rate
- **Alerts**: Error rate > 1%, p95 latency > 2s, job failures
- **Tracing**: OpenTelemetry for request flow

---

## 6) DATABASE SCHEMA

### Tables

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    preferred_books TEXT[] DEFAULT '{}',
    odds_format VARCHAR(20) DEFAULT 'american',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Teams
CREATE TABLE teams (
    id VARCHAR(10) PRIMARY KEY,  -- e.g., 'LAL', 'BOS'
    name VARCHAR(100) NOT NULL,  -- 'Los Angeles Lakers'
    conference VARCHAR(10),
    division VARCHAR(20)
);

-- Players
CREATE TABLE players (
    id INTEGER PRIMARY KEY,  -- NBA player ID
    name VARCHAR(100) NOT NULL,
    team_id VARCHAR(10) REFERENCES teams(id),
    position VARCHAR(10),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_name ON players(name);

-- Games
CREATE TABLE games (
    id VARCHAR(20) PRIMARY KEY,  -- e.g., '0022400123'
    date DATE NOT NULL,
    home_team_id VARCHAR(10) REFERENCES teams(id),
    away_team_id VARCHAR(10) REFERENCES teams(id),
    scheduled_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, live, final
    home_score INTEGER,
    away_score INTEGER,
    season VARCHAR(10)  -- '2024-25'
);

CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_teams ON games(home_team_id, away_team_id);

-- Player Game Stats
CREATE TABLE player_game_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    game_id VARCHAR(20) REFERENCES games(id),
    team_id VARCHAR(10) REFERENCES teams(id),
    minutes DECIMAL(5,2),
    points INTEGER,
    rebounds INTEGER,
    assists INTEGER,
    steals INTEGER,
    blocks INTEGER,
    turnovers INTEGER,
    three_pointers_made INTEGER,
    three_pointers_attempted INTEGER,
    field_goals_made INTEGER,
    field_goals_attempted INTEGER,
    free_throws_made INTEGER,
    free_throws_attempted INTEGER,
    plus_minus INTEGER,
    is_starter BOOLEAN,
    UNIQUE(player_id, game_id)
);

CREATE INDEX idx_player_stats_player ON player_game_stats(player_id);
CREATE INDEX idx_player_stats_game ON player_game_stats(game_id);
CREATE INDEX idx_player_stats_player_date ON player_game_stats(player_id, game_id);

-- Team Game Stats
CREATE TABLE team_game_stats (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(10) REFERENCES teams(id),
    game_id VARCHAR(20) REFERENCES games(id),
    opponent_id VARCHAR(10) REFERENCES teams(id),
    is_home BOOLEAN,
    points INTEGER,
    rebounds INTEGER,
    assists INTEGER,
    pace DECIMAL(5,2),  -- possessions per game
    offensive_rating DECIMAL(6,2),
    defensive_rating DECIMAL(6,2),
    UNIQUE(team_id, game_id)
);

CREATE INDEX idx_team_stats_team ON team_game_stats(team_id);
CREATE INDEX idx_team_stats_game ON team_game_stats(game_id);

-- Odds Snapshots
CREATE TABLE odds_snapshots (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(20) REFERENCES games(id),
    book_id VARCHAR(20) NOT NULL,  -- 'draftkings', 'fanduel', etc.
    market_type VARCHAR(30) NOT NULL,  -- 'spread', 'total', 'player_prop'
    prop_type VARCHAR(30),  -- 'points', 'rebounds', etc. (for player props)
    player_id INTEGER REFERENCES players(id),  -- NULL for game lines
    line_value DECIMAL(6,2) NOT NULL,
    over_odds INTEGER,  -- American odds (-110)
    under_odds INTEGER,
    home_odds INTEGER,  -- For spreads/moneylines
    away_odds INTEGER,
    captured_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_odds_game ON odds_snapshots(game_id);
CREATE INDEX idx_odds_player ON odds_snapshots(player_id);
CREATE INDEX idx_odds_captured ON odds_snapshots(captured_at DESC);
CREATE INDEX idx_odds_market ON odds_snapshots(market_type, prop_type);

-- Computed Features (Pre-aggregated)
CREATE TABLE computed_features (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    stat_type VARCHAR(30) NOT NULL,  -- 'points', 'rebounds', etc.
    window_type VARCHAR(20) NOT NULL,  -- 'L10', 'L20', 'season'
    opponent_id VARCHAR(10) REFERENCES teams(id),  -- NULL for all opponents
    home_away VARCHAR(10),  -- 'home', 'away', NULL for both

    -- Computed values
    average DECIMAL(6,2),
    median DECIMAL(6,2),
    std_dev DECIMAL(6,2),
    min_val INTEGER,
    max_val INTEGER,
    games_played INTEGER,

    -- Distribution buckets (for histograms)
    distribution JSONB,  -- {"0-10": 2, "11-20": 5, ...}

    computed_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(player_id, stat_type, window_type, opponent_id, home_away)
);

CREATE INDEX idx_features_player ON computed_features(player_id);
CREATE INDEX idx_features_lookup ON computed_features(player_id, stat_type, window_type);

-- User Favorites
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(20) NOT NULL,  -- 'player', 'team', 'market'
    entity_id VARCHAR(50) NOT NULL,  -- player_id, team_id, or market type
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- Tracked Bets (User's manual tracking)
CREATE TABLE tracked_bets (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    game_id VARCHAR(20) REFERENCES games(id),
    player_id INTEGER REFERENCES players(id),  -- NULL for game lines
    market_type VARCHAR(30) NOT NULL,
    prop_type VARCHAR(30),
    line_value DECIMAL(6,2) NOT NULL,
    bet_side VARCHAR(10) NOT NULL,  -- 'over', 'under', 'home', 'away'
    odds INTEGER,  -- American odds at time of tracking

    -- Outcome (filled after game)
    actual_value DECIMAL(6,2),
    result VARCHAR(10),  -- 'won', 'lost', 'push', NULL if pending

    tracked_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_tracked_user ON tracked_bets(user_id);
CREATE INDEX idx_tracked_game ON tracked_bets(game_id);
CREATE INDEX idx_tracked_pending ON tracked_bets(user_id, result) WHERE result IS NULL;

-- Analysis Cache
CREATE TABLE analyses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),  -- NULL for anonymous
    player_id INTEGER REFERENCES players(id),
    game_id VARCHAR(20) REFERENCES games(id),
    stat_type VARCHAR(30) NOT NULL,
    line_value DECIMAL(6,2) NOT NULL,

    -- LLM Output (cached)
    analysis_json JSONB NOT NULL,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '6 hours'
);

CREATE INDEX idx_analyses_lookup ON analyses(player_id, game_id, stat_type, line_value);
CREATE INDEX idx_analyses_expires ON analyses(expires_at);
```

---

## 7) BACKEND API CONTRACT

### Base URL

```
Production: https://api.nbaanalytics.app/v1
Development: http://localhost:8000/v1
```

### Authentication

```
Header: Authorization: Bearer <jwt_token>
```

### Endpoints

#### GET /lines

Get betting lines for a given date.

**Request**:
```
GET /lines?date=2024-12-15&book=draftkings&market=player_prop&team=LAL
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | No | ISO date (default: today) |
| book | string | No | Filter by book ID |
| market | string | No | spread, total, team_total, player_prop |
| team | string | No | Filter by team ID |

**Response** (200 OK):
```json
{
  "date": "2024-12-15",
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
          "home_team_total": {"line": 114.5, "over_odds": -110, "under_odds": -110}
        }
      ],
      "player_props": [
        {
          "player": {"id": 2544, "name": "LeBron James", "team": "LAL"},
          "props": [
            {
              "book": "draftkings",
              "stat": "points",
              "line": 25.5,
              "over_odds": -110,
              "under_odds": -110
            },
            {
              "book": "draftkings",
              "stat": "assists",
              "line": 7.5,
              "over_odds": -115,
              "under_odds": -105
            }
          ]
        }
      ]
    }
  ]
}
```

---

#### POST /analyze

Generate analysis for a specific betting line.

**Request**:
```json
{
  "player_id": 2544,
  "game_id": "0022400385",
  "stat": "points",
  "line": 25.5,
  "side": "over"
}
```

**Response** (200 OK):
```json
{
  "line": {
    "player": {"id": 2544, "name": "LeBron James"},
    "stat": "points",
    "value": 25.5,
    "side": "over"
  },
  "essential": {
    "l10_average": 27.3,
    "season_average": 25.8,
    "season_median": 26.0,
    "hit_rate_l10": {"hits": 7, "total": 10, "percentage": 70.0},
    "hit_rate_season": {"hits": 38, "total": 52, "percentage": 73.1}
  },
  "what_needs_to_happen": "LeBron needs to match or slightly exceed his recent production. His L10 average of 27.3 is 1.8 points above this line, and he's cleared it in 7 of his last 10 games.",
  "recent_vs_baseline": {
    "trend": "up",
    "summary": "LeBron is scoring 1.5 PPG above his season average over the last 10 games. His recent floor (21 pts) is still close to this line.",
    "l10_vs_season": 1.5,
    "recent_games": [29, 31, 24, 21, 28, 33, 25, 26, 30, 26]
  },
  "matchup": {
    "opponent": {"id": "BOS", "name": "Boston Celtics"},
    "opponent_rank": "8th in PPG allowed to SFs",
    "opponent_avg_allowed": 23.8,
    "h2h_this_season": {"games": 2, "average": 26.5, "hit_rate": 1},
    "home_away_split": {"location": "away", "average": 25.2, "hit_rate_pct": 68.0},
    "summary": "Boston allows 23.8 PPG to small forwards (8th most). LeBron averaged 26.5 in 2 games vs BOS this season, hitting this line once."
  },
  "risk_flags": [
    {
      "type": "blowout_risk",
      "severity": "medium",
      "description": "Lakers are 4.5-point underdogs. Blowout scenarios could limit 4th quarter minutes."
    }
  ],
  "takeaway": "LeBron's recent scoring (27.3 L10 avg) supports this line. The matchup is neutral—Boston isn't a particularly tough defensive draw for him. The main consideration is blowout risk given the 4.5-point spread, which could limit late-game minutes if LAL trails significantly."
}
```

---

#### GET /player/:id/splits

Get player statistical splits.

**Request**:
```
GET /player/2544/splits?stat=points&window=10&opponent=BOS&home_away=away
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| stat | string | Yes | points, rebounds, assists, etc. |
| window | int | No | Number of games (10, 20, or 0 for season) |
| opponent | string | No | Filter by opponent team ID |
| home_away | string | No | home or away |

**Response** (200 OK):
```json
{
  "player": {"id": 2544, "name": "LeBron James"},
  "stat": "points",
  "window": 10,
  "filters": {
    "opponent": null,
    "home_away": "away"
  },
  "stats": {
    "average": 25.2,
    "median": 25.0,
    "std_dev": 4.8,
    "min": 18,
    "max": 34,
    "games_played": 10
  },
  "games": [
    {"date": "2024-12-10", "opponent": "MIA", "value": 28, "minutes": 35.2},
    {"date": "2024-12-08", "opponent": "ORL", "value": 24, "minutes": 33.8}
  ],
  "distribution": {
    "buckets": [
      {"range": "15-19", "count": 1},
      {"range": "20-24", "count": 3},
      {"range": "25-29", "count": 4},
      {"range": "30-34", "count": 2}
    ]
  }
}
```

---

#### GET /trends

Get league-wide trends.

**Request**:
```
GET /trends?type=hot&stat=points&limit=10
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | No | hot, cold, consistent (default: hot) |
| stat | string | No | Filter by stat type |
| limit | int | No | Number of results (default: 10) |

**Response** (200 OK):
```json
{
  "type": "hot",
  "trends": [
    {
      "player": {"id": 1234, "name": "Tyrese Maxey", "team": "PHI"},
      "stat": "points",
      "reference_line": 23.5,
      "l10_average": 28.4,
      "season_average": 25.1,
      "hit_rate": {"hits": 9, "total": 10, "percentage": 90.0},
      "trend_score": 92.5
    }
  ]
}
```

---

#### POST /favorites

Add or remove a favorite.

**Request**:
```json
{
  "action": "add",
  "entity_type": "player",
  "entity_id": "2544"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "favorites_count": 5
}
```

---

#### GET /profile/history

Get user's tracked bet history.

**Request**:
```
GET /profile/history?status=pending&limit=20&offset=0
```

**Response** (200 OK):
```json
{
  "summary": {
    "total": 45,
    "won": 28,
    "lost": 15,
    "push": 2,
    "pending": 3,
    "win_rate": 65.1
  },
  "bets": [
    {
      "id": 123,
      "game": {
        "id": "0022400385",
        "matchup": "LAL @ BOS",
        "date": "2024-12-15",
        "time": "7:30 PM"
      },
      "player": {"id": 2544, "name": "LeBron James"},
      "market": "player_prop",
      "prop": "points",
      "line": 25.5,
      "side": "over",
      "odds": -110,
      "tracked_at": "2024-12-15T14:30:00Z",
      "status": "pending",
      "actual_value": null,
      "result": null
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 45
  }
}
```

---

#### POST /tracked-bets

Track a new bet.

**Request**:
```json
{
  "game_id": "0022400385",
  "player_id": 2544,
  "market_type": "player_prop",
  "prop_type": "points",
  "line_value": 25.5,
  "bet_side": "over",
  "odds": -110
}
```

**Response** (201 Created):
```json
{
  "id": 124,
  "tracked_at": "2024-12-15T16:45:00Z",
  "status": "pending"
}
```

---

## 8) COMPUTATIONS (ESSENTIAL METRICS)

### Last N Average

```python
def last_n_average(game_logs: List[GameLog], stat: str, n: int) -> float:
    """
    Calculate average of stat over last N games.

    Args:
        game_logs: Sorted by date descending
        stat: 'points', 'rebounds', 'assists', etc.
        n: Number of games (10, 20, etc.)

    Returns:
        Average value rounded to 1 decimal
    """
    recent_games = game_logs[:n]
    if not recent_games:
        return None

    values = [getattr(g, stat) for g in recent_games]
    return round(sum(values) / len(values), 1)
```

### Season Average

```python
def season_average(game_logs: List[GameLog], stat: str) -> float:
    """
    Calculate season average for stat.
    """
    if not game_logs:
        return None

    values = [getattr(g, stat) for g in game_logs]
    return round(sum(values) / len(values), 1)
```

### Hit Rate vs Line

```python
def hit_rate(game_logs: List[GameLog], stat: str, line: float,
             n: Optional[int] = None) -> Dict:
    """
    Calculate how often player exceeds line.

    Args:
        game_logs: Sorted by date descending
        stat: Stat type
        line: The betting line (e.g., 25.5)
        n: Limit to last N games (None = all)

    Returns:
        {hits: int, total: int, percentage: float}
    """
    games = game_logs[:n] if n else game_logs
    if not games:
        return {"hits": 0, "total": 0, "percentage": 0.0}

    hits = sum(1 for g in games if getattr(g, stat) > line)
    total = len(games)

    return {
        "hits": hits,
        "total": total,
        "percentage": round((hits / total) * 100, 1)
    }
```

### Season Median

```python
def season_median(game_logs: List[GameLog], stat: str) -> float:
    """
    Calculate median value for stat.
    """
    if not game_logs:
        return None

    values = sorted([getattr(g, stat) for g in game_logs])
    n = len(values)
    mid = n // 2

    if n % 2 == 0:
        return round((values[mid - 1] + values[mid]) / 2, 1)
    return float(values[mid])
```

### Percentile Calculation

```python
def percentile_rank(game_logs: List[GameLog], stat: str,
                    value: float) -> float:
    """
    Calculate what percentile a value falls at.

    Returns:
        Percentile (0-100)
    """
    values = sorted([getattr(g, stat) for g in game_logs])
    if not values:
        return None

    count_below = sum(1 for v in values if v < value)
    return round((count_below / len(values)) * 100, 1)
```

### Distribution Bins

```python
def distribution_bins(game_logs: List[GameLog], stat: str,
                      bin_size: int = 5) -> Dict[str, int]:
    """
    Create histogram buckets for stat distribution.

    Returns:
        {"0-4": 2, "5-9": 5, "10-14": 8, ...}
    """
    values = [getattr(g, stat) for g in game_logs]
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
```

### Matchup Hit Rate

```python
def matchup_hit_rate(game_logs: List[GameLog], stat: str, line: float,
                     opponent_id: str) -> Dict:
    """
    Calculate hit rate specifically against one opponent.
    """
    opponent_games = [g for g in game_logs if g.opponent_id == opponent_id]
    return hit_rate(opponent_games, stat, line)
```

### Volatility Flags

```python
def calculate_volatility_flags(player_id: int, game_logs: List[GameLog],
                                game_context: GameContext) -> List[Dict]:
    """
    Identify risk factors for the bet.

    Returns list of flags with type, severity, description.
    """
    flags = []

    # 1. Minutes volatility (std dev > 4 minutes)
    minutes = [g.minutes for g in game_logs[:10]]
    if minutes:
        std_dev = statistics.stdev(minutes) if len(minutes) > 1 else 0
        if std_dev > 4:
            flags.append({
                "type": "minutes_volatility",
                "severity": "medium" if std_dev < 6 else "high",
                "description": f"Minutes vary significantly (std dev: {std_dev:.1f}). "
                              f"Range: {min(minutes):.0f}-{max(minutes):.0f} in L10."
            })

    # 2. Blowout risk (spread > 8)
    if abs(game_context.spread) > 8:
        favored = "favorite" if game_context.spread < 0 else "underdog"
        flags.append({
            "type": "blowout_risk",
            "severity": "medium" if abs(game_context.spread) < 12 else "high",
            "description": f"Team is {abs(game_context.spread)}-point {favored}. "
                          f"Blowouts may affect playing time."
        })

    # 3. Role change (starter status changed recently)
    recent_starts = [g.is_starter for g in game_logs[:5]]
    season_start_rate = sum(1 for g in game_logs if g.is_starter) / len(game_logs)
    recent_start_rate = sum(recent_starts) / len(recent_starts) if recent_starts else 0

    if abs(recent_start_rate - season_start_rate) > 0.4:
        flags.append({
            "type": "role_change",
            "severity": "high",
            "description": "Recent change in starting role may affect production."
        })

    # 4. Back-to-back game
    if game_context.rest_days == 0:
        flags.append({
            "type": "back_to_back",
            "severity": "medium",
            "description": "Playing on zero rest (back-to-back). "
                          "May see reduced minutes or load management."
        })

    # 5. Key teammate injury
    if game_context.injured_teammates:
        for teammate in game_context.injured_teammates:
            if teammate.is_key_player:
                flags.append({
                    "type": "teammate_injury",
                    "severity": "medium",
                    "description": f"{teammate.name} is out. This may affect "
                                  f"usage/opportunities."
                })

    return flags
```

---

## 9) LLM INTEGRATION DESIGN

### Design Principles

1. **NOT a chatbot** — LLM generates structured UI content only
2. **JSON output only** — Strict schema validation
3. **Neutral tone** — Never recommend bets
4. **Computed data as input** — LLM doesn't calculate, only explains
5. **Cached responses** — Same inputs = cached output for 6 hours

### A) Analysis LLM Prompt

```
SYSTEM:
You are an NBA betting analytics assistant. Your role is to generate neutral,
data-driven analysis text for a sports betting analytics app.

RULES:
1. NEVER recommend whether to place a bet
2. NEVER use phrases like "good bet", "bad value", "I would take", "lock", "fade"
3. ALWAYS use neutral language: "supports", "aligns with", "suggests caution"
4. Be concise—users want quick insights, not essays
5. Focus on facts and data, not predictions
6. Output valid JSON matching the required schema exactly

USER:
Generate analysis for the following betting line:

**Player:** {player_name}
**Team:** {team_name} vs {opponent_name} ({home_away})
**Stat:** {stat_type}
**Line:** {side} {line_value}
**Game Date:** {game_date}

**Computed Metrics:**
- L10 Average: {l10_avg}
- Season Average: {season_avg}
- Season Median: {season_median}
- L10 Hit Rate: {l10_hits}/{l10_games} ({l10_hit_pct}%)
- Season Hit Rate: {season_hits}/{season_games} ({season_hit_pct}%)
- Std Dev (L10): {l10_std_dev}

**Matchup Data:**
- Opponent Rank vs Position: {opp_rank} ({opp_avg_allowed} {stat} allowed)
- H2H This Season: {h2h_games} games, {h2h_avg} avg, {h2h_hits}/{h2h_games} hit rate
- {home_away} Split: {split_avg} avg, {split_hit_pct}% hit rate

**Context:**
- Spread: {spread}
- Rest Days: {rest_days}
- Injured Teammates: {injured_list}
- Recent Games: {recent_values}

Output your analysis as JSON matching this exact schema:

```json
{
  "what_needs_to_happen": "string (1-2 sentences)",
  "recent_vs_baseline": "string (2-3 sentences)",
  "matchup_summary": "string (2-3 sentences)",
  "risk_flags": [
    {
      "type": "string",
      "severity": "low|medium|high",
      "description": "string"
    }
  ],
  "takeaway": "string (2-3 sentences, neutral conclusion)"
}
```
```

### B) Required JSON Output Schema

```json
{
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
            "enum": ["minutes_volatility", "blowout_risk", "role_change", "back_to_back", "teammate_injury", "cold_streak", "hot_streak"]
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
  "additionalProperties": false
}
```

### LLM Integration Code

```python
import json
import anthropic
from jsonschema import validate, ValidationError

ANALYSIS_SCHEMA = { ... }  # Schema from above

async def generate_analysis(
    player_data: dict,
    computed_metrics: dict,
    matchup_data: dict,
    context: dict
) -> dict:
    """
    Generate LLM analysis with JSON validation.
    """
    client = anthropic.Anthropic()

    prompt = build_analysis_prompt(
        player_data, computed_metrics, matchup_data, context
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
        system=SYSTEM_PROMPT
    )

    # Extract JSON from response
    response_text = response.content[0].text

    try:
        # Parse JSON
        analysis = json.loads(response_text)

        # Validate against schema
        validate(instance=analysis, schema=ANALYSIS_SCHEMA)

        return analysis

    except json.JSONDecodeError as e:
        # Retry once with explicit JSON reminder
        return await retry_with_json_reminder(prompt)

    except ValidationError as e:
        # Log validation error, return partial or error state
        logger.error(f"Schema validation failed: {e}")
        raise AnalysisGenerationError("Invalid analysis format")
```

---

## 10) MVP BUILD PLAN

### Phase 1: Foundation (Steps 1-4)

| Step | Task | Details | Deliverable |
|------|------|---------|-------------|
| 1 | **Project Setup** | FastAPI backend, React frontend, Postgres, Docker Compose | Running dev environment |
| 2 | **Mock Odds Source** | Create `MockOddsProvider` with realistic sample data for 5 games/day | `/lines` endpoint returns mock data |
| 3 | **Ingest NBA Schedule** | Fetch 2024-25 schedule from nba_api, populate `games` table | Schedule data in DB |
| 4 | **Ingest Player Stats** | Fetch game logs for top 100 players, populate `player_game_stats` | Stats data in DB |

### Phase 2: Core Features (Steps 5-8)

| Step | Task | Details | Deliverable |
|------|------|---------|-------------|
| 5 | **Compute Features** | Build feature computation jobs (averages, hit rates, splits) | `computed_features` populated |
| 6 | **Build Lines UI** | React: Lines screen with filters, game cards, line rows | Browsable lines interface |
| 7 | **Build Analyze UI** | React: Analyze screen with essential stats, collapsible sections | Analysis view (hardcoded text) |
| 8 | **LLM Integration** | Integrate Claude API, JSON validation, caching | Dynamic analysis text |

### Phase 3: Polish & Production (Steps 9-12)

| Step | Task | Details | Deliverable |
|------|------|---------|-------------|
| 9 | **User Auth** | JWT auth, user registration, protected routes | Login/signup flow |
| 10 | **Favorites & Tracking** | Save favorites, track bets, view history | Profile tab functional |
| 11 | **Trends Screen** | Compute hot/cold streaks, build Trends UI | Trends tab functional |
| 12 | **Caching & Rate Limiting** | Redis cache for odds/analysis, rate limit API | Performance optimized |

### Phase 4: Launch Prep (Steps 13-15)

| Step | Task | Details | Deliverable |
|------|------|---------|-------------|
| 13 | **Real Odds Source** | Integrate The Odds API (or chosen provider) | Live odds data |
| 14 | **QA & Testing** | Unit tests, integration tests, manual QA | Test coverage >70% |
| 15 | **Deploy & Monitor** | Deploy to cloud, setup monitoring, load testing | Production launch |

### Security Basics

- **API Keys**: Store in environment variables, never commit
- **Auth**: JWT with refresh tokens, bcrypt password hashing
- **CORS**: Whitelist specific origins only
- **Input Validation**: Pydantic models for all inputs
- **SQL Injection**: Use parameterized queries (SQLAlchemy ORM)
- **Rate Limiting**: 100 req/min per user, 10 req/min for analysis

### Responsible Gambling UX

- **Neutral Language**: No "locks", "must-bet", or guarantees
- **Disclaimers**: Footer on every screen: "For informational purposes only"
- **No Real Money**: App never handles transactions
- **Optional Limits**: Users can set daily/weekly tracking limits
- **Resources Link**: Link to responsible gambling resources in settings
- **No Push Notifications for Bets**: Only allow opt-in alerts for line movements

### Performance Targets

| Metric | Target |
|--------|--------|
| Lines page load (p95) | < 500ms |
| Analyze page load (p95) | < 1500ms (includes LLM) |
| LLM generation (p95) | < 3000ms |
| API error rate | < 0.1% |
| Uptime | 99.5% |

---

## 11) V2 FEATURES (PRIORITIZED)

### Priority 1: High Value

| Feature | Description | Effort |
|---------|-------------|--------|
| **Line Movement Chart** | Historical odds chart showing line movement over time | Medium |
| **Multi-Book Best Odds** | Show best available odds across all books | Medium |
| **Alerts** | Push notification when line crosses user threshold | Medium |

### Priority 2: Engagement

| Feature | Description | Effort |
|---------|-------------|--------|
| **Shareable Analysis Cards** | Generate image cards for social sharing | Medium |
| **Similar Past Games** | "Games where LeBron faced similar conditions" carousel | High |
| **Personalized Filters** | Remember user's preferred books/markets/teams | Low |

### Priority 3: Advanced

| Feature | Description | Effort |
|---------|-------------|--------|
| **Correlation Analysis** | "If X happens, Y is more likely" insights | High |
| **Same-Game Parlay Analysis** | Analyze multi-leg SGPs | High |
| **Live Game Integration** | Real-time stat tracking during games | Very High |

### Priority 4: Nice-to-Have

| Feature | Description | Effort |
|---------|-------------|--------|
| **Referee Trends** | Historical referee data impact | Medium |
| **Pace Projections** | Projected game pace impact on totals | Medium |
| **Export Data** | Download tracked bets as CSV | Low |
| **Dark Mode** | UI theme toggle | Low |

---

## Appendix: Sample UI Wireframes (ASCII)

### Mobile Analyze Screen (Expanded)

```
┌──────────────────────────────────────────┐
│ ←                              ☆         │
│                                          │
│        LeBron James · Points             │
│   ┌────────────────────────────────┐     │
│   │      OVER 25.5  (-110)         │     │
│   └────────────────────────────────┘     │
│                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                          │
│ ESSENTIAL STATS                          │
│ ┌────────────────────────────────────┐   │
│ │  L10 Average         27.3         │   │
│ │  Season Average      25.8         │   │
│ │  Season Median       26.0         │   │
│ │                                    │   │
│ │  Hit Rate (L10)      7/10 (70%)   │   │
│ │  Hit Rate (Season)   38/52 (73%)  │   │
│ │                                    │   │
│ │  [L10] [L20] [Season]             │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ▾ WHAT NEEDS TO HAPPEN                   │
│ ┌────────────────────────────────────┐   │
│ │ LeBron needs to match or slightly  │   │
│ │ exceed his L10 average. He's hit   │   │
│ │ this line in 7 of 10 recent games. │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ▾ RECENT VS BASELINE                     │
│ ┌────────────────────────────────────┐   │
│ │ ↑ Trending up (+1.5 vs season)    │   │
│ │                                    │   │
│ │ Last 5: ● ● ○ ● ●  (4/5 hit)      │   │
│ │         29 31 24 28 33             │   │
│ │                                    │   │
│ │ Recent production is above his     │   │
│ │ season baseline. Floor of 21 in   │   │
│ │ L10 is close to this line.        │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ▸ MATCHUP CONTEXT                        │
│ ▸ VOLATILITY FLAGS (1)                   │
│                                          │
│ ▾ BOTTOM LINE                            │
│ ┌────────────────────────────────────┐   │
│ │ LeBron's recent output aligns with │   │
│ │ this line. Matchup vs BOS is       │   │
│ │ neutral. Main factor: blowout risk │   │
│ │ if LAL trails as 4.5-pt dogs.      │   │
│ └────────────────────────────────────┘   │
│                                          │
│  ┌────────────────────────────────┐      │
│  │       Track This Bet           │      │
│  └────────────────────────────────┘      │
│                                          │
│ ─────────────────────────────────────── │
│ Analytics only. Not betting advice.      │
└──────────────────────────────────────────┘
```

---

*End of Design Specification*
