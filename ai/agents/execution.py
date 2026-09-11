from __future__ import annotations

import json

from ai.agents.base import (
    Agent,
    AgentContractError,
    AgentRequest,
    AgentResult,
    AgentUnknown,
)


class ExecutionAnalyst(Agent):
    agent_id = "execution-analyst"

    def build_prompt(self, request: AgentRequest) -> tuple[str, str]:
        system_prompt = """
You are You Can't Trade's Execution Analyst.

Your job is to interpret ONLY the supplied trade execution evidence.

The recorded trade fields and deterministic execution intelligence
are authoritative.

Always distinguish planned values from actual values.

Examples:
- planned entry is not proof of an actual fill
- planned target is not proof of an actual exit
- planned stop is not proof that the stop was executed
- planned risk/reward is not actual realized risk/reward

Do not invent missing execution facts.

Do not infer an exit price when none is recorded.
Do not infer slippage when none is recorded.
Do not assume an order was filled unless the supplied evidence supports it.

Do not:
- fabricate execution data
- provide trading signals
- provide financial advice
- predict future execution
- claim an execution event occurred without evidence

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

Prefer a small number of useful findings.

If actual execution information is missing, explicitly identify it
as unknown rather than treating the planned value as actual execution.
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
        
        context = request.context

        if any(key in context for key in ("trade", "execution")):
            execution = context.get("execution") or {}

            actual_fields = [
                execution.get("actualEntry"),
                execution.get("actualStopLoss"),
                execution.get("actualTakeProfit"),
                execution.get("entryTime"),
                execution.get("exitTime"),
            ]

            has_actual_execution = any(
                value is not None
                for value in actual_fields
            )

            if not has_actual_execution:
                return AgentResult(
                    agent_id=self.agent_id,
                    status="ok",
                    observations=[],
                    interpretations=[],
                    unknowns=[
                        AgentUnknown(
                            text=(
                                "No actual execution details were recorded. "
                                "The planned entry, stop, target, and recorded "
                                "result do not establish an actual fill or "
                                "exit price."
                            )
                        )
                    ],
                    evidence_refs=["trade", "intelligence"],
                )

        result = super().parse_result(request, payload)

        if result.agent_id != self.agent_id:
            raise AgentContractError(
                "execution analyst returned an invalid agent id"
            )

        return result