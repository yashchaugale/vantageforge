"""Small provider contract used by the API and analysis layer."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class StorageProviderError(RuntimeError):
    """A safe, user-facing storage failure without provider credentials."""


class StorageProvider(ABC):
    name = "unknown"

    @abstractmethod
    def status(self) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def create_trade(self, trade: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def get_trade(self, trade_id: str) -> dict[str, Any] | None:
        raise NotImplementedError

    @abstractmethod
    def update_trade(self, trade_id: str, trade: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def delete_trade(self, trade_id: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def list_trades(self, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def search_trades(self, query: str, limit: int = 50) -> list[dict[str, Any]]:
        raise NotImplementedError

    def count_trades(self) -> int:
        return len(self.list_trades(limit=1000))

    def get_recent_trades(self, limit: int = 20) -> list[dict[str, Any]]:
        return self.list_trades(limit=limit)

    def get_similar_trades(self, trade_id: str, limit: int = 10) -> list[dict[str, Any]]:
        raise NotImplementedError

    def get_historical_context(self, trade_id: str, limit: int = 10) -> dict[str, Any]:
        raise NotImplementedError

    def get_statistics(self) -> dict[str, Any]:
        raise NotImplementedError

    def health_check(self) -> dict[str, Any]:
        return self.status()
