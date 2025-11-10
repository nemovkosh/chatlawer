from __future__ import annotations

from datetime import datetime
from typing import Any, TypedDict
from uuid import uuid4

from supabase import Client
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import get_settings
from ..dependencies import get_supabase_client


class SupabaseUpsertResult(TypedDict, total=False):
    id: str
    created_at: datetime
    updated_at: datetime


class SupabaseService:
    """Wrapper around Supabase Python client with convenience helpers."""

    def __init__(self, client: Client | None = None):
        self.client = client or get_supabase_client()
        self.settings = get_settings()

    @retry(wait=wait_exponential(multiplier=1, min=1, max=6), stop=stop_after_attempt(3))
    def insert(self, table: str, data: dict[str, Any]) -> list[dict[str, Any]]:
        response = (
            self.client.table(table)
            .insert(data | {"id": data.get("id") or str(uuid4())})
            .execute()
        )
        return response.data or []

    @retry(wait=wait_exponential(multiplier=1, min=1, max=6), stop=stop_after_attempt(3))
    def update(self, table: str, record_id: str, data: dict[str, Any]) -> list[dict[str, Any]]:
        response = (
            self.client.table(table)
            .update(data)
            .eq("id", record_id)
            .execute()
        )
        return response.data or []

    @retry(wait=wait_exponential(multiplier=1, min=1, max=6), stop=stop_after_attempt(3))
    def delete(self, table: str, record_id: str) -> None:
        self.client.table(table).delete().eq("id", record_id).execute()

    def select_by_id(self, table: str, record_id: str) -> dict[str, Any] | None:
        response = self.client.table(table).select("*").eq("id", record_id).single().execute()
        return response.data

    def select(
        self,
        table: str,
        *,
        filters: dict[str, Any] | None = None,
        order: tuple[str, bool] | None = None,
    ) -> list[dict[str, Any]]:
        query = self.client.table(table).select("*")
        if filters:
            for column, value in filters.items():
                query = query.eq(column, value)
        if order:
            column, ascending = order
            query = query.order(column, desc=not ascending)
        response = query.execute()
        return response.data or []

