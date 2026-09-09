from __future__ import annotations

import json

from ai.agents.base import (
    Agent,
    AgentContractError,
    AgentRequest,
    AgentResult,
)


class HistoricalAnalyst(Agent):
    agent_id = "historical-analyst"

    def build_prompt(self, request: AgentRequest) -> tuple[str, str]:
        system_prompt = """
You are VantageForge's Historical Analyst.

Read the supplied historical evidence and summarize what it shows.

Return ONLY this JSON:

{
  "observations": ["string"],
  "interpretations": ["string"],
  "unknowns": ["string"],
  "evidenceRefs": ["string"]
}

Rules:
- Write 1-3 observations.
- Write 0-2 interpretations.
- Write unknowns only when something important is missing.
- Use only the supplied historical numbers and facts.
- Do not calculate new statistics.
- Do not predict the current trade.
- Do not give trading advice.
- Do not claim causation.
- Do not repeat the input JSON.
- Do not output tradeId, context, or historical objects.

Focus on:
- number of comparable trades
- recorded wins/losses
- win rate
- similarity score
- recorded pattern references

Example:

{
  "observations": [
    "The retrieved sample contains 10 similar trades, with 9 having recorded outcomes: 8 wins and 1 loss.",
    "The recorded win rate among those 9 trades is 88.89%."
  ],
  "interpretations": [
    "The retrieved sample was predominantly profitable."
  ],
  "unknowns": [
    "Actual R is unavailable for the reviewed sample."
  ],
  "evidenceRefs": ["historical"]
}
""".strip()

        user_prompt = json.dumps(
            {
                "tradeId": request.trade_id,
                "historical": request.context.get("historical", {}),
                "evidence": request.evidence,
            },
            ensure_ascii=False,
        )

        return system_prompt, user_prompt

    def parse_result(
        self,
        request: AgentRequest,
        payload: dict,
    ) -> AgentResult:
        result = super().parse_result(request, payload)

        if result.agent_id != self.agent_id:
            raise AgentContractError(
                "historical analyst returned an invalid agent id"
            )

        if not (
            result.observations
            or result.interpretations
            or result.unknowns
            or result.evidence_refs
        ):
            raise AgentContractError(
                "historical analyst returned no analytical findings"
            )

        return result