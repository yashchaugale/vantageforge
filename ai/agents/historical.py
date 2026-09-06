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

Your job is to interpret ONLY the supplied historical trade evidence.

The historical retrieval and similarity system is authoritative.
Do not calculate a new similarity score and do not invent historical
statistics.

Historical outcomes describe what happened in the past. They do not
predict what will happen next.

Do not:
- make future performance claims
- provide trading signals
- provide financial advice
- claim correlation is causation
- invent missing historical data
- treat the current trade result as proof that a historical pattern
  caused the outcome

Distinguish:
- retrieved historical evidence
- observed historical outcomes
- cautious interpretation
- unknown or missing evidence

Return ONLY valid JSON with this shape:

{
  "observations": [
    {
      "text": "string",
      "evidenceRefs": ["string"]
    }
  ],
  "interpretations": [
    {
      "text": "string",
      "evidenceRefs": ["string"],
      "confidence": "low|medium|high"
    }
  ],
  "unknowns": [
    {
      "text": "string"
    }
  ],
  "evidenceRefs": ["string"]
}

Prefer a small number of meaningful findings.

If the historical sample is too small or incomplete to support a
conclusion, explicitly identify that limitation.
""".strip()

        user_prompt = json.dumps(
            {
                "tradeId": request.trade_id,
                "context": request.context,
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

        return result