from __future__ import annotations

from typing import Any

from ..models import Case, CaseCreate, CaseUpdate
from .supabase_service import SupabaseService


class CaseService:
    def __init__(self, supabase: SupabaseService | None = None):
        self.supabase = supabase or SupabaseService()

    def list_cases(self, user_id: str) -> list[Case]:
        records = self.supabase.select("cases", filters={"user_id": user_id}, order=("updated_at", False))
        return [Case(**record) for record in records]

    def create_case(self, user_id: str, payload: CaseCreate) -> Case:
        data: dict[str, Any] = payload.model_dump()
        insert_payload = data | {"user_id": user_id}
        record = self.supabase.insert("cases", insert_payload)[0]
        return Case(**record)

    def get_case(self, case_id: str) -> Case | None:
        record = self.supabase.select_by_id("cases", case_id)
        return Case(**record) if record else None

    def update_case(self, case_id: str, payload: CaseUpdate) -> Case | None:
        data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
        if not data:
            return self.get_case(case_id)
        record = self.supabase.update("cases", case_id, data)[0]
        return Case(**record)

    def delete_case(self, case_id: str) -> None:
        self.supabase.delete("cases", case_id)

