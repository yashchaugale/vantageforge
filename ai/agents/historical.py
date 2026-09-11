from __future__ import annotations

import json

from ai.agents.base import (
    Agent,
    
    AgentObservation,
    AgentRequest,
    AgentResult,
    AgentUnknown,
    AgentInterpretation,
    validate_agent_result,
)


class HistoricalAnalyst(Agent):
    agent_id = "historical-analyst"

    def build_prompt(self, request: AgentRequest) -> tuple[str, str]:
        system_prompt = """
You are the You Can't Trade Historical Analyst.

Historical outcomes describe what happened in the past.
Do not turn historical outcomes into predictions.

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
Do not calculate a new similarity score.
Do not invent facts.

If the data contains wins, losses, sample size, win rate, similarity score,
or planned RR, you may mention those recorded values.

Return ONLY the JSON object.
""".strip()

        user_prompt = json.dumps(
            {
                "tradeId": request.trade_id,
                "context": {
                    "historical": request.context.get("historical", {}),
                },
                "evidence": request.evidence,
            },
            ensure_ascii=False,
        )

        return system_prompt, user_prompt

    def parse_result(self, request, payload):
        observations = [
            AgentObservation(
                text=item["text"],
                evidence_refs=item.get(
                    "evidenceRefs",
                    ["intelligence.historical"],
                ),
            )
            for item in payload.get("observations", [])
            if item.get("text")
        ]

        interpretations = [
            AgentInterpretation(
                text=item["text"],
                evidence_refs=item.get(
                    "evidenceRefs",
                    ["intelligence.historical"],
                ),
                confidence=item.get("confidence", "low"),
            )
            for item in payload.get("interpretations", [])
            if item.get("text")
        ]

        unknowns = [
            AgentUnknown(text=item["text"])
            for item in payload.get("unknowns", [])
            if item.get("text")
        ]

        result = AgentResult(
            agent_id=self.agent_id,
            status="ok",
            observations=observations,
            interpretations=interpretations,
            unknowns=unknowns,
            evidence_refs=payload.get(
                "evidenceRefs",
                ["intelligence.historical"],
            ),
            contract_version=request.contract_version,
        )

        validate_agent_result(result)
        return result