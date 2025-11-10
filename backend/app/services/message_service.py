from __future__ import annotations

from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from ..config import get_settings
from ..models import EmbeddingChunk, Message, MessageCreate
from .supabase_service import SupabaseService


class MessageService:
    def __init__(self, supabase: SupabaseService | None = None):
        self.supabase = supabase or SupabaseService()
        self.settings = get_settings()
        client_kwargs = {"api_key": self.settings.openai_api_key}
        if self.settings.openai_api_base:
            client_kwargs["base_url"] = self.settings.openai_api_base
        self.client = AsyncOpenAI(**client_kwargs)

    def list_messages(self, chat_id: str) -> list[Message]:
        records = self.supabase.select(
            "messages",
            filters={"chat_id": chat_id},
            order=("created_at", True),
        )
        return [Message(**record) for record in records]

    def create_message(self, chat_id: str, payload: MessageCreate) -> Message:
        record = self.supabase.insert("messages", {"chat_id": chat_id, **payload.model_dump()})[0]
        return Message(**record)

    def get_context_chunks(self, case_id: str) -> list[EmbeddingChunk]:
        documents = self.supabase.select("documents", filters={"case_id": case_id})
        document_ids = [doc["id"] for doc in documents]
        if not document_ids:
            return []

        query = self.supabase.client.table("document_embeddings").select("*")
        query = query.in_("document_id", document_ids).order("chunk_index", desc=False).limit(
            self.settings.max_context_chunks
        )
        response = query.execute()
        chunk_records = response.data or []
        return [EmbeddingChunk(**record) for record in chunk_records]

    async def stream_assistant_reply(
        self,
        *,
        chat_history: list[dict[str, str]],
        contextual_chunks: list[str],
    ) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": self.settings.system_prompt}]
        if contextual_chunks:
            context_blob = "\n---\n".join(contextual_chunks)
            messages.append(
                {
                    "role": "system",
                    "content": f"Relevant case materials:\n{context_blob}",
                }
            )
        messages.extend(chat_history)

        stream = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=messages,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.get("content")
            if delta:
                yield delta

