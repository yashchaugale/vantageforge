from __future__ import annotations

import json
from typing import Any

from ai.agents.base import (
    Agent,
    AgentContractError,
    AgentRequest,
    AgentResult,
    validate_agent_request,
)



class SingleCallAgentRunner:
    """
    Executes the complete multi-agent analysis in one model request.

    The specialist agents remain logically separate and their existing
    contracts are preserved. The model receives all specialist roles in
    one structured request and returns one structured payload containing
    each specialist result plus the synthesis result.
    """

    def __init__(self, ai_service):
        self.ai_service = ai_service

    def run(
        self,
        *,
        agents: list[Agent],
        synthesis_agent: Agent,
        requests: dict[str, AgentRequest],
        synthesis_request: AgentRequest,
    ) -> tuple[dict[str, AgentResult], AgentResult, dict[str, Any]]:
        if not agents:
            raise AgentContractError("At least one specialist agent is required.")

        specialist_payloads: list[dict[str, Any]] = []

        for agent in agents:
            request = requests.get(agent.agent_id)
            if request is None:
                raise AgentContractError(
                    f"Missing request for specialist '{agent.agent_id}'."
                )

            validate_agent_request(request)

            system_prompt, user_prompt = agent.build_prompt(request)

            specialist_payloads.append(
                {
                    "agent_id": agent.agent_id,
                    "system_prompt": system_prompt,
                    "user_prompt": user_prompt,
                }
            )

        synthesis_system_prompt, synthesis_user_prompt = (
            synthesis_agent.build_prompt(synthesis_request)
        )

        combined_system_prompt = self._build_system_prompt(
            specialist_payloads=specialist_payloads,
            synthesis_system_prompt=synthesis_system_prompt,
        )

        combined_user_prompt = self._build_user_prompt(
            specialist_payloads=specialist_payloads,
            synthesis_user_prompt=synthesis_user_prompt,
        )

        payload, _response = self.ai_service.generate_structured(
            system_prompt=combined_system_prompt,
            user_prompt=combined_user_prompt,
            max_tokens=1800,
            temperature=0,
        )

        if not isinstance(payload, dict):
            raise AgentContractError(
                "Single-call multi-agent response must be a JSON object."
            )

        specialists_payload = payload.get("specialists")
        synthesis_payload = payload.get("synthesis")

        if not isinstance(specialists_payload, dict):
            raise AgentContractError(
                "Single-call response is missing 'specialists' object."
            )

        if not isinstance(synthesis_payload, dict):
            raise AgentContractError(
                "Single-call response is missing 'synthesis' object."
            )

        specialist_results: dict[str, AgentResult] = {}

        for agent in agents:
            request = requests[agent.agent_id]
            agent_payload = specialists_payload.get(agent.agent_id)

            if not isinstance(agent_payload, dict):
                raise AgentContractError(
                    f"Missing specialist result for '{agent.agent_id}'."
                )

            specialist_results[agent.agent_id] = agent.parse_result(
                request,
                agent_payload,
            )

        synthesis_result = synthesis_agent.parse_result(
            synthesis_request,
            synthesis_payload,
        )

        return specialist_results, synthesis_result, synthesis_payload

    @staticmethod
    def _build_system_prompt(
        *,
        specialist_payloads: list[dict[str, Any]],
        synthesis_system_prompt: str,
    ) -> str:
        specialist_sections = []

        for item in specialist_payloads:
            specialist_sections.append(
                f"""
SPECIALIST: {item["agent_id"]}

ROLE INSTRUCTIONS:
{item["system_prompt"]}
""".strip()
            )

        return f"""
You are running VantageForge's complete post-trade multi-agent reasoning
pipeline in ONE model request.

The logical stages are:

1. Structure Analyst
2. Historical Analyst
3. Behavior Analyst
4. Execution Analyst
5. Synthesis Agent

Each specialist must reason only from the context supplied to it.
Do not invent facts.

The deterministic intelligence and recorded trade data are authoritative
for factual claims.

Historical evidence describes past recorded trades only. It must not be
turned into predictions or guarantees.

Planned execution values must never be described as actual execution.

Missing information must remain unknown.

No trading signals, buy/sell recommendations, price predictions,
strategy recommendations, or financial advice are allowed.

The specialist outputs must be completed before the synthesis output.
The synthesis must use the specialist outputs as additional evidence,
while preserving the source-priority rules in its instructions.

{chr(10).join(specialist_sections)}

SYNTHESIS INSTRUCTIONS:

{synthesis_system_prompt}

Return exactly this JSON structure:

{{
  "specialists": {{
    "<agent_id>": {{
      "observations": [
        {{
          "text": "string",
          "confidence": "low|medium|high",
          "evidenceRefs": ["string"]
        }}
      ],
      "interpretations": [
        {{
          "text": "string",
          "confidence": "low|medium|high",
          "evidenceRefs": ["string"]
        }}
      ],
      "unknowns": [
        {{
          "text": "string",
          "evidenceRefs": ["string"]
        }}
      ]
    }}
  }},
  "synthesis": {{
    "summary": "string",
    "keyObservations": ["string"],
    "action": "string",
    "unknowns": ["string"],
    "evidenceRefs": ["string"]
  }}
}}

Every specialist listed in the request must have an entry in
"specialists".

Do not add any fields outside this structure.
""".strip()

    @staticmethod
    def _build_user_prompt(
        *,
        specialist_payloads: list[dict[str, Any]],
        synthesis_user_prompt: str,
    ) -> str:
        specialist_sections = []

        for item in specialist_payloads:
            specialist_sections.append(
                f"""
SPECIALIST: {item["agent_id"]}

CONTEXT AND TASK:
{item["user_prompt"]}
""".strip()
            )

        return f"""
Execute all four specialist analyses and then synthesize them.

Complete each specialist independently before producing the synthesis.

{chr(10).join(specialist_sections)}

SYNTHESIS TASK:

{synthesis_user_prompt}

Return only the requested JSON object.
""".strip()