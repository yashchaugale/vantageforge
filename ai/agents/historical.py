from __future__ import annotations

import json

from ai.agents.base import (
    Agent,
    
    AgentObservation,
    AgentRequest,
    AgentResult,
    AgentUnknown,
    validate_agent_result,
)


class HistoricalAnalyst(Agent):
    agent_id = "historical-analyst"

    def build_prompt(self, request: AgentRequest) -> tuple[str, str]:
        system_prompt = """
You are a historical trade analyst.

Read the historical data in the user message.

Return a NEW analysis. Do not copy or repeat the user's JSON.

Your entire response must be one JSON object with exactly these keys:

{
  "observations": [
    {
      "text": "one factual observation",
      "evidenceRefs": ["historical"]
    }
  ],
  "interpretations": [
    {
      "text": "one cautious interpretation",
      "evidenceRefs": ["historical"],
      "confidence": "low"
    }
  ],
  "unknowns": [
    {
      "text": "one missing fact"
    }
  ],
  "evidenceRefs": ["historical"]
}

Use only facts present in the historical data.

Do not predict.
Do not give trading advice.
Do not calculate new statistics.
Do not invent facts.

If the data contains wins, losses, sample size, win rate, similarity score,
or planned RR, you may mention those recorded values.

Return ONLY the JSON object.
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

    def parse_result(self, request, payload):
        historical = request.context.get("historical", {})
        comparable_stats = historical.get("comparableStats", {})

        observations = []

        reviewed_sample_size = comparable_stats.get("reviewedSampleSize")
        wins = comparable_stats.get("wins")
        losses = comparable_stats.get("losses")
        win_rate = comparable_stats.get("winRate")
        similarity_score = historical.get("similarityScore")

        if reviewed_sample_size is not None:
            observations.append(
                AgentObservation(
                    text=f"The historical sample contains {reviewed_sample_size} reviewed trades.",
                    evidence_refs=["historical"],
                )
            )

        if wins is not None and losses is not None:
            observations.append(
                AgentObservation(
                    text=f"The comparable historical sample contains {wins} wins and {losses} loss{'es' if losses != 1 else ''}.",
                    evidence_refs=["historical"],
                )
            )

        if win_rate is not None:
            observations.append(
                AgentObservation(
                    text=f"The comparable historical sample has a recorded win rate of {win_rate * 100:.2f}%.",
                    evidence_refs=["historical"],
                )
            )

        if similarity_score is not None:
            observations.append(
                AgentObservation(
                    text=f"The retrieved historical match has a similarity score of {similarity_score}.",
                    evidence_refs=["historical"],
                )
            )

        unknowns = []

        if not observations:
            unknowns.append(
                AgentUnknown(
                    text="No usable historical statistics were recorded for this trade."
                )
            )

        result = AgentResult(
            agent_id=self.agent_id,
            status="ok",
            observations=observations,
            interpretations=[],
            unknowns=unknowns,
            evidence_refs=["historical"] if observations else [],
            contract_version=request.contract_version,
        )

        validate_agent_result(result)
        return result