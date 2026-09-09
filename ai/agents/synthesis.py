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

Create a short post-trade review from the supplied evidence.

Your job:
1. State the most important facts about the trade.
2. State the most important historical finding.
3. Use specialist findings when they contain useful evidence.
4. State important missing information.
5. Give one small journaling or documentation action grounded in the evidence.

Return ONLY this JSON:

{
  "summary": "2-4 concise sentences",
  "keyObservations": ["string"],
  "action": "string",
  "unknowns": ["string"],
  "evidenceRefs": ["string"]
}

IMPORTANT:
- The "summary" field is REQUIRED.
- Never leave "summary" empty.
- Do NOT output tradeId.
- Do NOT output a "context" object.
- Do NOT copy the input JSON.
- Do NOT output a "historical" object.
- Do NOT output specialist objects.
- You must write the final review.

Use only supplied evidence.

Rules:
- Recorded trade facts are authoritative.
- Deterministic intelligence is authoritative.
- Historical statistics describe past trades only.
- Historical outcomes do not predict the current trade.
- Do not claim causation unless the evidence establishes it.
- Do not turn planned execution into actual execution.
- Do not invent missing information.
- Do not give trading advice, signals, or predictions.
- Do not recommend buying or selling.

Historical interpretation:
- Treat comparableStats as the retrieved historical sample.
- Treat patternReferences as the source trade fingerprint.
- Do not claim every retrieved trade shared every pattern unless explicitly shown.
- Similarity score is a retrieval score, not a probability.

For the action:
- Prefer improving documentation or measurement of something already recorded.
- Do not invent a new strategy, setup, entry rule, exit rule, or market condition.
- If there is not enough evidence for an action, use an empty string.

Keep the response concise.

Return ONLY valid JSON.
""".strip()

        user_prompt = json.dumps(
            {
                "tradeId": request.trade_id,
                "trade": request.context.get("trade", {}),
                "historical": request.context.get(
                    "intelligence", {}
                ).get("historical", {}),
                "specialists": request.context.get("specialists", {}),
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