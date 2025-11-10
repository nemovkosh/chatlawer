from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from ..models import Message, MessageCreate
from ..services.chat_service import ChatService
from ..services.message_service import MessageService

router = APIRouter(prefix="/chats/{chat_id}/messages", tags=["messages"])


def get_message_service() -> MessageService:
    return MessageService()


def get_chat_service() -> ChatService:
    return ChatService()


@router.get("/", response_model=list[Message])
def list_messages(chat_id: str, service: MessageService = Depends(get_message_service)):
    return service.list_messages(chat_id)


@router.post("/", response_model=Message, status_code=status.HTTP_201_CREATED)
def create_message(
    chat_id: str,
    payload: MessageCreate,
    service: MessageService = Depends(get_message_service),
):
    return service.create_message(chat_id, payload)


@router.post("/stream")
async def stream_message(
    chat_id: str,
    payload: MessageCreate,
    message_service: MessageService = Depends(get_message_service),
    chat_service: ChatService = Depends(get_chat_service),
):
    chat = chat_service.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

    history = [
        {"role": msg.role, "content": msg.content}
        for msg in message_service.list_messages(chat_id)
    ]
    history.append(payload.model_dump())
    contextual_chunks = [
        chunk.content
        for chunk in message_service.get_context_chunks(chat.case_id)
    ]

    async def token_generator() -> AsyncGenerator[bytes, None]:
        async for token in message_service.stream_assistant_reply(
            chat_history=history,
            contextual_chunks=contextual_chunks,
        ):
            yield token.encode("utf-8")

    return StreamingResponse(token_generator(), media_type="text/event-stream")

