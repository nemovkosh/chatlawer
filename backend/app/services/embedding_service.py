from __future__ import annotations

from typing import Iterable

from openai import OpenAI

from ..config import get_settings
from ..models import Document
from .supabase_service import SupabaseService


class EmbeddingService:
    def __init__(self, supabase: SupabaseService | None = None):
        self.supabase = supabase or SupabaseService()
        self.settings = get_settings()
        client_kwargs = {"api_key": self.settings.openai_api_key}
        if self.settings.openai_api_base:
            client_kwargs["base_url"] = self.settings.openai_api_base
        self.client = OpenAI(**client_kwargs)

    def _chunk_text(self, text: str) -> list[str]:
        size = self.settings.chunk_size
        overlap = self.settings.chunk_overlap
        if not text:
            return []

        chunks: list[str] = []
        start = 0
        text_length = len(text)
        while start < text_length:
            end = min(start + size, text_length)
            chunk = text[start:end]
            chunks.append(chunk.strip())
            if end == text_length:
                break
            start = end - overlap
            if start < 0:
                start = 0
        return [chunk for chunk in chunks if chunk]

    def _delete_existing_embeddings(self, document_id: str) -> None:
        self.supabase.client.table("document_embeddings").delete().eq("document_id", document_id).execute()

    def generate_embeddings(self, document: Document, text: str) -> None:
        chunks = self._chunk_text(text)
        if not chunks:
            return

        response = self.client.embeddings.create(
            model=self.settings.embeddings_model,
            input=chunks,
        )

        for index, (chunk_text, embedding_data) in enumerate(zip(chunks, response.data)):
            payload = {
                "document_id": document.id,
                "chunk_index": index,
                "content": chunk_text,
                "embedding": embedding_data.embedding,
            }
            self.supabase.insert("document_embeddings", payload)

    def reindex_document(self, document: Document, text: str) -> None:
        self._delete_existing_embeddings(document.id)
        self.generate_embeddings(document, text)

