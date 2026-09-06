from __future__ import annotations

import json

from ai.agents.base import (
    Agent,
    AgentContractError,
    AgentRequest,
    AgentResult,
)


class SynthesisAgent(Agent):
    agent_id = "synthesis-agent"

    def build_prompt(self, request: AgentRequest) -> tuple[str, str]:
        system_prompt = """
You are VantageForge's Synthesis Agent.

Your job is to combine verified trade facts, deterministic intelligence,
historical evidence, and specialist-agent findings into one concise
post-trade review.

The source-of-truth priority is:

1. Recorded trade facts
2. Deterministic intelligence
3. Retrieved historical evidence
4. Specialist observations
5. Specialist interpretations

Interpretations must never overwrite facts.

Historical evidence must be interpreted conservatively.

"historical.comparableStats" describes the retrieved historical sample.
"historical.patternReferences" describes the source trade's recorded
fingerprint and is not proof that every trade in the historical sample
shared every referenced pattern.

Do not describe a combination of pattern references as the defining
filter of the historical sample unless the supplied historical evidence
explicitly establishes that relationship.

You must distinguish:
- observed facts
- historical observations
- interpretations
- unknown information

Do not invent missing information.

Do not turn planned execution into actual execution.
Do not turn historical outcomes into predictions.
Do not treat an interpretation as a fact.
Do not claim causation without evidence.

Do not:
- predict future price movement
- provide trading signals
- provide financial advice
- recommend buying or selling
- fabricate execution details
- diagnose psychological conditions

The final action must be a small journaling or process experiment
grounded directly in recorded evidence.

Prefer actions that:
- improve missing or incomplete trade documentation
- improve measurement of an already recorded process or rule
- ask the trader to observe or record something already present in
  the trade, rules, behavior, execution, or historical evidence

Do not invent a new trading hypothesis, setup condition, entry rule,
exit rule, market condition, or strategy.

Do not recommend testing a new market behavior unless that behavior
was already explicitly recorded as a rule, setup feature, or historical
pattern in the supplied evidence.

If the available evidence is insufficient for a grounded experiment,
return an empty action string.

Return ONLY valid JSON with exactly this shape:

{
  "summary": "string",
  "keyObservations": [
    "string"
  ],
  "action": "string",
  "unknowns": [
    "string"
  ],
  "evidenceRefs": [
    "string"
  ]
}

The summary should be 2-4 concise sentences.

Prefer a few high-value findings over a long report.
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
        summary = payload.get("summary")

        if not isinstance(summary, str) or not summary.strip():
            raise AgentContractError(
                "synthesis agent must return a non-empty summary"
            )

        key_observations = payload.get("keyObservations", [])
        action = payload.get("action", "")
        unknowns = payload.get("unknowns", [])
        evidence_refs = payload.get("evidenceRefs", [])

        if not isinstance(key_observations, list):
            raise AgentContractError(
                "keyObservations must be a list"
            )

        if not all(
            isinstance(item, str)
            for item in key_observations
        ):
            raise AgentContractError(
                "keyObservations must contain strings"
            )

        if not isinstance(action, str):
            raise AgentContractError(
                "action must be a string"
            )

        if not isinstance(unknowns, list):
            raise AgentContractError(
                "unknowns must be a list"
            )

        if not all(
            isinstance(item, str)
            for item in unknowns
        ):
            raise AgentContractError(
                "unknowns must contain strings"
            )

        if not isinstance(evidence_refs, list):
            raise AgentContractError(
                "evidenceRefs must be a list"
            )

        result = AgentResult(
            agent_id=self.agent_id,
            status="ok",
            observations=[],
            interpretations=[],
            unknowns=[],
            evidence_refs=evidence_refs,
        )

        # The synthesis-specific payload is attached dynamically so the
        # common AgentResult contract remains unchanged for specialist agents.
        object.__setattr__(
            result,
            "_synthesis",
            {
                "summary": summary.strip(),
                "keyObservations": key_observations,
                "action": action.strip(),
                "unknowns": unknowns,
                "evidenceRefs": evidence_refs,
            },
        )

        return result

    @staticmethod
    def extract_output(result: AgentResult) -> dict:
        output = getattr(result, "_synthesis", None)

        if not isinstance(output, dict):
            raise AgentContractError(
                "synthesis result does not contain synthesis output"
            )

        return output