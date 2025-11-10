from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class CaseBase(BaseModel):
    title: str
    tags: list[str] = Field(default_factory=list)


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    title: str | None = None
    tags: list[str] | None = None


class Case(CaseBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class DocumentBase(BaseModel):
    file_name: str
    file_url: HttpUrl
    content: str | None = None


class Document(DocumentBase):
    id: str
    case_id: str
    created_at: datetime


class ChatBase(BaseModel):
    title: str


class Chat(ChatBase):
    id: str
    case_id: str
    created_at: datetime


class MessageBase(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class Message(MessageBase):
    id: str
    chat_id: str
    created_at: datetime


class MessageCreate(MessageBase):
    pass


class EmbeddingChunk(BaseModel):
    id: str
    document_id: str
    chunk_index: int
    content: str
    created_at: datetime

