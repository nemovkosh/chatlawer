from __future__ import annotations

from ..models import Chat
from .supabase_service import SupabaseService


class ChatService:
    def __init__(self, supabase: SupabaseService | None = None):
        self.supabase = supabase or SupabaseService()

    def list_chats(self, case_id: str) -> list[Chat]:
        records = self.supabase.select("chats", filters={"case_id": case_id}, order=("created_at", False))
        return [Chat(**record) for record in records]

    def create_chat(self, case_id: str, title: str) -> Chat:
        record = self.supabase.insert("chats", {"case_id": case_id, "title": title})[0]
        return Chat(**record)

    def get_chat(self, chat_id: str) -> Chat | None:
        record = self.supabase.select_by_id("chats", chat_id)
        return Chat(**record) if record else None

    def delete_chat(self, chat_id: str) -> None:
        self.supabase.delete("chats", chat_id)

