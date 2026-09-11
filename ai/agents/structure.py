from __future__ import annotations

import json

from ai.agents.base import (
    Agent,
    AgentContractError,
    AgentRequest,
    AgentResult,
)


class StructureAnalyst(Agent):
    agent_id = "structure-analyst"

    def build_prompt(self, request: AgentRequest) -> tuple[str, str]:
        system_prompt = """
You are You Can't Trade's Structure Analyst.

Your job is to interpret ONLY the supplied deterministic market
context and market structure.

The deterministic intelligence is authoritative.

Do not calculate or invent market-structure events.
Do not create BOS, CHOCH, swings, levels, trends, or regimes that
are not present in the supplied evidence.

Do not predict future price movement.
Do not provide trading signals or financial advice.
Do not claim that structure caused the trade result.

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

Prefer a small number of useful observations over exhaustive
description.

If the supplied structure does not support a conclusion, say so
through an unknown rather than guessing.
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
                "structure analyst returned an invalid agent id"
            )

        return result