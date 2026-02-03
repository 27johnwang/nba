"""LLM-powered analysis service."""
import json
import logging
from typing import Any, Optional

from jsonschema import validate, ValidationError
import anthropic

from app.core.config import get_settings
from app.schemas.schemas import ANALYSIS_LLM_SCHEMA

settings = get_settings()
logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are an NBA betting analytics assistant. Your role is to generate neutral, data-driven analysis text for a sports betting analytics app.

RULES:
1. NEVER recommend whether to place a bet
2. NEVER use phrases like "good bet", "bad value", "I would take", "lock", "fade"
3. ALWAYS use neutral language: "supports", "aligns with", "suggests caution"
4. Be concise—users want quick insights, not essays
5. Focus on facts and data, not predictions
6. Output valid JSON matching the required schema exactly
7. Do not include any text outside the JSON object"""


def build_analysis_prompt(
    player_data: dict,
    computed_metrics: dict,
    matchup_data: dict,
    context: dict,
) -> str:
    """Build the analysis prompt with all context."""
    recent_values = computed_metrics.get("recent_values", [])
    recent_str = ", ".join(str(v) for v in recent_values[:10]) if recent_values else "N/A"

    prompt = f"""Generate analysis for the following betting line:

**Player:** {player_data.get('name', 'Unknown')}
**Team:** {player_data.get('team', 'Unknown')} vs {matchup_data.get('opponent_name', 'Unknown')} ({context.get('home_away', 'Unknown')})
**Stat:** {computed_metrics.get('stat_type', 'Unknown')}
**Line:** {context.get('side', 'over')} {computed_metrics.get('line_value', 0)}
**Game Date:** {context.get('game_date', 'Unknown')}

**Computed Metrics:**
- L10 Average: {computed_metrics.get('l10_avg', 'N/A')}
- Season Average: {computed_metrics.get('season_avg', 'N/A')}
- Season Median: {computed_metrics.get('season_median', 'N/A')}
- L10 Hit Rate: {computed_metrics.get('l10_hits', 0)}/{computed_metrics.get('l10_games', 0)} ({computed_metrics.get('l10_hit_pct', 0)}%)
- Season Hit Rate: {computed_metrics.get('season_hits', 0)}/{computed_metrics.get('season_games', 0)} ({computed_metrics.get('season_hit_pct', 0)}%)
- Std Dev (L10): {computed_metrics.get('l10_std_dev', 'N/A')}

**Matchup Data:**
- Opponent Rank vs Position: {matchup_data.get('opp_rank', 'N/A')} ({matchup_data.get('opp_avg_allowed', 'N/A')} {computed_metrics.get('stat_type', '')} allowed)
- H2H This Season: {matchup_data.get('h2h_games', 0)} games, {matchup_data.get('h2h_avg', 'N/A')} avg, {matchup_data.get('h2h_hits', 0)}/{matchup_data.get('h2h_games', 0)} hit rate
- {context.get('home_away', '').title()} Split: {matchup_data.get('split_avg', 'N/A')} avg, {matchup_data.get('split_hit_pct', 'N/A')}% hit rate

**Context:**
- Spread: {context.get('spread', 'N/A')}
- Rest Days: {context.get('rest_days', 'N/A')}
- Injured Teammates: {context.get('injured_list', 'None')}
- Recent Games: {recent_str}

Output your analysis as JSON matching this exact schema:

{{
  "what_needs_to_happen": "string (1-2 sentences)",
  "recent_vs_baseline": "string (2-3 sentences)",
  "matchup_summary": "string (2-3 sentences)",
  "risk_flags": [
    {{
      "type": "string (minutes_volatility|blowout_risk|role_change|back_to_back|teammate_injury|cold_streak|hot_streak)",
      "severity": "low|medium|high",
      "description": "string"
    }}
  ],
  "takeaway": "string (2-3 sentences, neutral conclusion)"
}}

Respond with ONLY the JSON object, no additional text."""

    return prompt


class AnalysisService:
    """Service for generating LLM-powered betting analysis."""

    def __init__(self):
        self.client = None
        if settings.anthropic_api_key:
            self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    async def generate_analysis(
        self,
        player_data: dict,
        computed_metrics: dict,
        matchup_data: dict,
        context: dict,
    ) -> dict:
        """Generate LLM analysis with JSON validation."""
        # If no API key, return mock analysis
        if not self.client:
            return self._generate_mock_analysis(player_data, computed_metrics, matchup_data, context)

        prompt = build_analysis_prompt(player_data, computed_metrics, matchup_data, context)

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = response.content[0].text

            # Try to extract JSON from response
            analysis = self._parse_json_response(response_text)

            # Validate against schema
            validate(instance=analysis, schema=ANALYSIS_LLM_SCHEMA)

            return analysis

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            # Retry once with explicit reminder
            return await self._retry_with_json_reminder(prompt)

        except ValidationError as e:
            logger.error(f"Schema validation failed: {e}")
            # Return mock analysis as fallback
            return self._generate_mock_analysis(player_data, computed_metrics, matchup_data, context)

        except Exception as e:
            logger.error(f"Analysis generation failed: {e}")
            return self._generate_mock_analysis(player_data, computed_metrics, matchup_data, context)

    def _parse_json_response(self, response_text: str) -> dict:
        """Parse JSON from LLM response, handling potential formatting issues."""
        # Try direct parsing first
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            pass

        # Try to find JSON object in response
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(response_text[start:end])
            except json.JSONDecodeError:
                pass

        raise json.JSONDecodeError("No valid JSON found", response_text, 0)

    async def _retry_with_json_reminder(self, original_prompt: str) -> dict:
        """Retry generation with explicit JSON reminder."""
        retry_prompt = f"""{original_prompt}

IMPORTANT: Your previous response was not valid JSON. Please respond with ONLY a valid JSON object, starting with {{ and ending with }}. No other text."""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": retry_prompt}],
            )

            response_text = response.content[0].text
            analysis = self._parse_json_response(response_text)
            validate(instance=analysis, schema=ANALYSIS_LLM_SCHEMA)
            return analysis

        except Exception as e:
            logger.error(f"Retry failed: {e}")
            raise

    def _generate_mock_analysis(
        self,
        player_data: dict,
        computed_metrics: dict,
        matchup_data: dict,
        context: dict,
    ) -> dict:
        """Generate mock analysis when LLM is unavailable."""
        player_name = player_data.get("name", "This player")
        stat_type = computed_metrics.get("stat_type", "points")
        line_value = computed_metrics.get("line_value", 0)
        l10_avg = computed_metrics.get("l10_avg", 0)
        season_avg = computed_metrics.get("season_avg", 0)
        l10_hit_pct = computed_metrics.get("l10_hit_pct", 0)
        opponent_name = matchup_data.get("opponent_name", "the opponent")

        diff = l10_avg - line_value if l10_avg else 0

        what_needs = f"{player_name} needs to {'exceed' if diff < 0 else 'match'} {'approximately ' + str(abs(diff):.1f) + ' ' + stat_type + ' above' if diff < 0 else 'their recent average of ' + str(l10_avg)} to hit this line."

        if l10_avg > season_avg:
            trend = "up"
            baseline = f"{player_name} is trending above their season baseline, averaging {l10_avg} over the last 10 games compared to {season_avg} for the season."
        elif l10_avg < season_avg:
            trend = "down"
            baseline = f"{player_name} has been slightly below their season average recently, with {l10_avg} over L10 vs {season_avg} on the season."
        else:
            trend = "stable"
            baseline = f"{player_name}'s recent production ({l10_avg}) is consistent with their season average ({season_avg})."

        matchup_summary = f"Playing against {opponent_name}. Historical performance and matchup data should be considered when evaluating this line."

        risk_flags = []
        spread = context.get("spread", 0)
        if spread and abs(spread) > 8:
            risk_flags.append({
                "type": "blowout_risk",
                "severity": "medium" if abs(spread) < 12 else "high",
                "description": f"Game spread of {abs(spread)} points may impact minutes if game becomes lopsided."
            })

        if context.get("rest_days") == 0:
            risk_flags.append({
                "type": "back_to_back",
                "severity": "medium",
                "description": "Playing on zero rest days (back-to-back game)."
            })

        takeaway = f"{player_name}'s L10 average of {l10_avg} {stat_type} is {'above' if l10_avg > line_value else 'below' if l10_avg < line_value else 'right at'} this line. With a {l10_hit_pct}% hit rate over the last 10 games, the data {'supports' if l10_hit_pct >= 60 else 'shows mixed results on' if l10_hit_pct >= 40 else 'suggests caution on'} this line."

        return {
            "what_needs_to_happen": what_needs,
            "recent_vs_baseline": baseline,
            "matchup_summary": matchup_summary,
            "risk_flags": risk_flags,
            "takeaway": takeaway,
        }
