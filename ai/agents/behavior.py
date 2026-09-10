from __future__ import annotations

import json

from ai.agents.base import (
    Agent,
    AgentContractError,
    AgentRequest,
    AgentResult,
    AgentUnknown,
)


class BehaviorAnalyst(Agent):
    agent_id = "behavior-analyst"

    def build_prompt(self, request: AgentRequest) -> tuple[str, str]:
        system_prompt = """
You are VantageForge's Behavior Analyst.

Your job is to interpret ONLY explicitly recorded trading behavior,
rules, discipline, emotions, and journal evidence.

The supplied trade record and deterministic behavior/rule intelligence
are authoritative.

Do not infer psychological states, intentions, personality traits, or
emotions that were not explicitly recorded.

Do not diagnose the trader.

Do not claim that a behavior caused a trade outcome unless the supplied
evidence directly supports that conclusion.

Do not:
- invent rule violations
- invent emotions
- invent motivations
- diagnose psychological conditions
- provide trading signals
- provide financial advice
- predict future performance

Distinguish between:
- explicitly recorded behavior
- deterministic rule analysis
- cautious interpretation
- missing information

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

If behavior evidence is missing, explicitly state that it is unknown
rather than guessing.
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

        if any(key in context for key in ("behavior", "rules", "trade")):
            behavior = context.get("behavior") or {}
            rules = context.get("rules") or {}
            trade = context.get("trade") or {}

            has_behavior_evidence = any(
                [
                    bool(behavior.get("ruleViolations")),
                    bool(behavior.get("tags")),
                    bool(behavior.get("evidence")),
                    bool(rules.get("applicable")),
                    bool(rules.get("satisfied")),
                    bool(rules.get("violated")),
                    bool(trade.get("setup")),
                    bool(trade.get("session")),
                    bool(trade.get("review")),
                ]
            )

            if not has_behavior_evidence:
                return AgentResult(
                    agent_id=self.agent_id,
                    status="ok",
                    observations=[],
                    interpretations=[],
                    unknowns=[
                        AgentUnknown(
                            text=(
                                "No explicitly recorded behavior, rule, "
                                "discipline, emotion, or journal evidence "
                                "was supplied for this trade."
                            )
                        )
                    ],
                    evidence_refs=[],
                )

        result = super().parse_result(request, payload)

        if result.agent_id != self.agent_id:
            raise AgentContractError(
                "behavior analyst returned an invalid agent id"
            )

        return result