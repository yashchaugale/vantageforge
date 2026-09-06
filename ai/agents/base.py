from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


AGENT_CONTRACT_VERSION = 1


@dataclass(frozen=True)
class AgentRequest:
    trade_id: str
    agent_id: str
    context: dict[str, Any]
    evidence: list[dict[str, Any]] = field(default_factory=list)
    contract_version: int = AGENT_CONTRACT_VERSION

    def to_dict(self) -> dict[str, Any]:
        return {
            "tradeId": self.trade_id,
            "agentId": self.agent_id,
            "contractVersion": self.contract_version,
            "context": self.context,
            "evidence": self.evidence,
        }


@dataclass(frozen=True)
class AgentObservation:
    text: str
    evidence_refs: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "text": self.text,
            "evidenceRefs": self.evidence_refs,
        }


@dataclass(frozen=True)
class AgentInterpretation:
    text: str
    evidence_refs: list[str] = field(default_factory=list)
    confidence: str = "low"

    def to_dict(self) -> dict[str, Any]:
        return {
            "text": self.text,
            "evidenceRefs": self.evidence_refs,
            "confidence": self.confidence,
        }


@dataclass(frozen=True)
class AgentUnknown:
    text: str

    def to_dict(self) -> dict[str, Any]:
        return {"text": self.text}


@dataclass(frozen=True)
class AgentResult:
    agent_id: str
    status: str
    observations: list[AgentObservation] = field(default_factory=list)
    interpretations: list[AgentInterpretation] = field(default_factory=list)
    unknowns: list[AgentUnknown] = field(default_factory=list)
    evidence_refs: list[str] = field(default_factory=list)
    contract_version: int = AGENT_CONTRACT_VERSION
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        result = {
            "agentId": self.agent_id,
            "contractVersion": self.contract_version,
            "status": self.status,
            "observations": [
                observation.to_dict()
                for observation in self.observations
            ],
            "interpretations": [
                interpretation.to_dict()
                for interpretation in self.interpretations
            ],
            "unknowns": [
                unknown.to_dict()
                for unknown in self.unknowns
            ],
            "evidenceRefs": self.evidence_refs,
        }

        if self.error:
            result["error"] = self.error

        return result


class AgentError(RuntimeError):
    """Base error for the reasoning-agent layer."""


class AgentContractError(AgentError):
    """Raised when an agent request or result violates its contract."""


class Agent:
    agent_id = "base"

    def build_prompt(self, request: AgentRequest) -> tuple[str, str]:
        raise NotImplementedError

    def parse_result(
        self,
        request: AgentRequest,
        payload: dict[str, Any],
    ) -> AgentResult:
        observations = [
            AgentObservation(
                text=item["text"],
                evidence_refs=item.get("evidenceRefs", []),
            )
            for item in payload.get("observations", [])
            if isinstance(item, dict) and isinstance(item.get("text"), str)
        ]

        interpretations = [
            AgentInterpretation(
                text=item["text"],
                evidence_refs=item.get("evidenceRefs", []),
                confidence=item.get("confidence", "low"),
            )
            for item in payload.get("interpretations", [])
            if isinstance(item, dict) and isinstance(item.get("text"), str)
        ]

        unknowns = [
            AgentUnknown(text=item["text"])
            for item in payload.get("unknowns", [])
            if isinstance(item, dict) and isinstance(item.get("text"), str)
        ]

        result = AgentResult(
            agent_id=self.agent_id,
            status="ok",
            observations=observations,
            interpretations=interpretations,
            unknowns=unknowns,
            evidence_refs=payload.get("evidenceRefs", []),
        )

        validate_agent_result(result)

        return result


def validate_agent_request(request: AgentRequest) -> None:
    if not request.trade_id:
        raise AgentContractError("trade_id is required")

    if not request.agent_id:
        raise AgentContractError("agent_id is required")

    if not isinstance(request.context, dict):
        raise AgentContractError("context must be an object")

    if not isinstance(request.evidence, list):
        raise AgentContractError("evidence must be a list")

    if request.contract_version != AGENT_CONTRACT_VERSION:
        raise AgentContractError(
            f"unsupported contract version: {request.contract_version}"
        )


def validate_agent_result(result: AgentResult) -> None:
    if not result.agent_id:
        raise AgentContractError("agent_id is required")

    if result.status not in {"ok", "error"}:
        raise AgentContractError(
            f"unsupported agent status: {result.status}"
        )

    allowed_confidence = {"low", "medium", "high"}

    for interpretation in result.interpretations:
        if interpretation.confidence not in allowed_confidence:
            raise AgentContractError(
                f"unsupported confidence: {interpretation.confidence}"
            )

    if result.status == "error" and not result.error:
        raise AgentContractError(
            "error result must contain an error message"
        )