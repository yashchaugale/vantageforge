from __future__ import annotations

from typing import Any

from ai.agents.base import (
    Agent,
    AgentContractError,
    AgentRequest,
    AgentResult,
    validate_agent_request,
)


class AgentRunner:
    """
    Provider-neutral runner for reasoning agents.

    The runner owns model communication.
    Agents own prompt construction and response interpretation.
    """

    def __init__(self, ai_service: Any):
        self.ai_service = ai_service

    def run(
        self,
        agent: Agent,
        request: AgentRequest,
    ) -> AgentResult:
        validate_agent_request(request)

        system_prompt, user_prompt = agent.build_prompt(request)

        payload, _response = self.ai_service.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=800,
            temperature=0,
        )

        if not isinstance(payload, dict):
            raise AgentContractError(
                f"{agent.agent_id} must return a JSON object"
            )

        return agent.parse_result(request, payload)