from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ai.agents.base import AgentRequest, AgentResult
from ai.agents.behavior import BehaviorAnalyst
from ai.agents.execution import ExecutionAnalyst
from ai.agents.historical import HistoricalAnalyst
from ai.agents.runner import AgentRunner
from ai.agents.single_call_runner import SingleCallAgentRunner
from ai.agents.structure import StructureAnalyst
from ai.agents.synthesis import SynthesisAgent


@dataclass(frozen=True)
class PipelineResult:
    trade_id: str
    specialists: dict[str, AgentResult]
    synthesis: AgentResult | None
    synthesis_output: dict[str, Any] | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "tradeId": self.trade_id,
            "specialists": {
                agent_id: result.to_dict()
                for agent_id, result in self.specialists.items()
            },
            "synthesis": (
                self.synthesis.to_dict()
                if self.synthesis
                else None
            ),
            "synthesisOutput": self.synthesis_output,
        }


class AgentPipeline:
    """
    V1 multi-agent reasoning pipeline.

    Four specialists analyze independently. The synthesis agent then
    combines their outputs with the authoritative trade context.
    """

    def __init__(self, runner: AgentRunner):
        self.runner = runner
        self.single_call_runner = SingleCallAgentRunner(runner.ai_service)

        self.specialists = (
            StructureAnalyst(),
            HistoricalAnalyst(),
            BehaviorAnalyst(),
            ExecutionAnalyst(),
        )

        self.synthesis_agent = SynthesisAgent()

    def run(
        self,
        *,
        trade_id: str,
        context: dict[str, Any],
        evidence: list[dict[str, Any]] | None = None,
    ) -> PipelineResult:
        evidence = evidence or []

        specialist_requests: dict[str, AgentRequest] = {}

        for agent in self.specialists:
            specialist_requests[agent.agent_id] = AgentRequest(
                trade_id=trade_id,
                agent_id=agent.agent_id,
                context=self._specialist_context(
                    agent.agent_id,
                    context,
                ),
                evidence=evidence,
            )

        synthesis_context = {
            "trade": {
                "id": context.get("trade", {}).get("id"),
                "symbol": context.get("trade", {}).get("symbol"),
                "timeframe": context.get("trade", {}).get("timeframe"),
                "direction": context.get("trade", {}).get("direction"),
                "entry": context.get("trade", {}).get("entry"),
                "stopLoss": context.get("trade", {}).get("stopLoss"),
                "takeProfit": context.get("trade", {}).get("takeProfit"),
                "exitPrice": context.get("trade", {}).get("exitPrice"),
                "result": context.get("trade", {}).get("result"),
                "setup": context.get("trade", {}).get("setup"),
                "session": context.get("trade", {}).get("session"),
                "planAdherence": context.get("trade", {}).get("planAdherence"),
                "executionTag": context.get("trade", {}).get("executionTag"),
                "emotions": context.get("trade", {}).get("emotions", []),
            },
            "intelligence": {
                "marketContext": context.get("intelligence", {}).get(
                    "marketContext", {}
                ),
                "marketStructure": {
                    "state": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("state")
                    ),
                    "direction": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("direction")
                    ),
                    "activeHigh": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("activeHigh")
                    ),
                    "activeLow": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("activeLow")
                    ),
                    "protectedHigh": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("protectedHigh")
                    ),
                    "protectedLow": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("protectedLow")
                    ),
                    "protectedLevelType": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("protectedLevelType")
                    ),
                    "watchingLevelType": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("watchingLevelType")
                    ),
                    "watchingAction": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("watchingAction")
                    ),
                    "lastBOS": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("lastBOS")
                    ),
                    "lastCHOCH": (
                        context.get("intelligence", {})
                        .get("marketStructure", {})
                        .get("lastCHOCH")
                    ),
                },
                "setupFingerprint": context.get("intelligence", {}).get(
                    "setupFingerprint", {}
                ),
                "calculated": context.get("intelligence", {}).get(
                    "calculated", {}
                ),
                "execution": context.get("intelligence", {}).get(
                    "execution", {}
                ),
                "behavior": context.get("intelligence", {}).get(
                    "behavior", {}
                ),
                "rules": context.get("intelligence", {}).get(
                    "rules", {}
                ),
                "historical": context.get("intelligence", {}).get(
                    "historical", {}
                ),
            },
        }

        synthesis_request = AgentRequest(
            trade_id=trade_id,
            agent_id=self.synthesis_agent.agent_id,
            context=synthesis_context,
            evidence=evidence,
        )

        try:
            specialist_results, synthesis_result = (
                self.single_call_runner.run(
                    agents=list(self.specialists),
                    synthesis_agent=self.synthesis_agent,
                    requests=specialist_requests,
                    synthesis_request=synthesis_request,
                )
            )

            synthesis_output = synthesis_result.to_dict().get("_synthesis")

            if not isinstance(synthesis_output, dict):
                synthesis_output = {
                    "error": synthesis_result.error
                } if synthesis_result.status == "error" else None

        except Exception as exc:
            error = str(exc)

            specialist_results = {
                agent.agent_id: AgentResult(
                    agent_id=agent.agent_id,
                    status="error",
                    error=error,
                )
                for agent in self.specialists
            }

            synthesis_result = AgentResult(
                agent_id=self.synthesis_agent.agent_id,
                status="error",
                error=error,
            )

            synthesis_output = {
                "error": error,
            }

        return PipelineResult(
            trade_id=trade_id,
            specialists=specialist_results,
            synthesis=synthesis_result,
            synthesis_output=synthesis_output,
        )

    def _specialist_context(
        self,
        agent_id: str,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Restrict specialist context to the namespaces relevant to that
        specialist. This reduces unnecessary context and limits accidental
        cross-domain reasoning.
        """

        trade = context.get("trade", {})
        intelligence = context.get("intelligence", {})

        if agent_id == "structure-analyst":
            market_context = intelligence.get("marketContext", {})
            market_structure = intelligence.get("marketStructure", {})
            setup_fingerprint = intelligence.get("setupFingerprint", {})
            calculated = intelligence.get("calculated", {})

            return {
                "trade": {
                    "symbol": trade.get("symbol"),
                    "timeframe": trade.get("timeframe"),
                    "direction": trade.get("direction"),
                    "chartAnchorTime": trade.get("chartAnchorTime"),
                },
                "marketContext": {
                    "trend": market_context.get("trend"),
                    "regime": market_context.get("regime"),
                    "volatility": market_context.get("volatility"),
                    "momentum": market_context.get("momentum"),
                    "session": market_context.get("session"),
                    "higherTimeframe": market_context.get("higherTimeframe"),
                },
                "marketStructure": {
                    "state": market_structure.get("state"),
                    "direction": market_structure.get("direction"),
                    "activeHigh": market_structure.get("activeHigh"),
                    "activeLow": market_structure.get("activeLow"),
                    "protectedHigh": market_structure.get("protectedHigh"),
                    "protectedLow": market_structure.get("protectedLow"),
                    "protectedLevel": market_structure.get("protectedLevel"),
                    "protectedLevelType": market_structure.get(
                        "protectedLevelType"
                    ),
                    "watchingLevel": market_structure.get("watchingLevel"),
                    "watchingLevelType": market_structure.get(
                        "watchingLevelType"
                    ),
                    "watchingAction": market_structure.get(
                        "watchingAction"
                    ),
                    "lastBOS": market_structure.get("lastBOS"),
                    "lastCHOCH": market_structure.get("lastCHOCH"),
                    "events": [
                    {
                        "sequence": event.get("sequence"),
                        "time": event.get("time"),
                        "event": event.get("event"),
                        "previousState": event.get("previousState"),
                        "state": event.get("state"),
                        "broken": {
                            "type": (event.get("broken") or {}).get("type"),
                            "price": (event.get("broken") or {}).get("price"),
                        },
                        "origin": {
                            "type": (event.get("origin") or {}).get("type"),
                            "price": (event.get("origin") or {}).get("price"),
                        },
                    }
                    for event in (
                        market_structure.get("events", [])[-6:]
                        if isinstance(market_structure.get("events", []), list)
                        else []
                    )
                    if isinstance(event, dict)
                ],
                },
                "setupFingerprint": {
                    "features": setup_fingerprint.get("features", []),
                    "tags": setup_fingerprint.get("tags", []),
                    "marketRegime": setup_fingerprint.get("marketRegime"),
                },
                "calculated": {
                        "features": calculated.get("features", {}),
                    }
            }

        if agent_id == "historical-analyst":
            return {
                "trade": {
                    "symbol": trade.get("symbol"),
                    "timeframe": trade.get("timeframe"),
                    "direction": trade.get("direction"),
                },
                "marketContext": intelligence.get(
                    "marketContext",
                    {},
                ),
                "setupFingerprint": intelligence.get(
                    "setupFingerprint",
                    {},
                ),
                "historical": intelligence.get(
                    "historical",
                    {},
                ),
            }

        if agent_id == "behavior-analyst":
            return {
                "trade": {
                    "setup": trade.get("setup"),
                    "session": trade.get("session"),
                    "review": trade.get("review", {}),
                },
                "behavior": intelligence.get(
                    "behavior",
                    {},
                ),
                "rules": intelligence.get(
                    "rules",
                    {},
                ),
            }

        if agent_id == "execution-analyst":
            return {
                "trade": {
                    "direction": trade.get("direction"),
                    "entry": trade.get("entry"),
                    "stopLoss": trade.get("stopLoss"),
                    "takeProfit": trade.get("takeProfit"),
                    "exitPrice": trade.get("exitPrice"),
                    "result": trade.get("result"),
                    "execution": trade.get("execution") or {},
                    "review": trade.get("review") or {},
                },
                "execution": intelligence.get(
                    "execution",
                    {},
                ),
                "calculated": intelligence.get(
                    "calculated",
                    {},
                ),
            }

        return context