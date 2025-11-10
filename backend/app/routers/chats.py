from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..models import Chat
from ..services.chat_service import ChatService

router = APIRouter(prefix="/cases/{case_id}/chats", tags=["chats"])


def get_chat_service() -> ChatService:
    return ChatService()


@router.get("/", response_model=list[Chat])
def list_chats(case_id: str, service: ChatService = Depends(get_chat_service)):
    return service.list_chats(case_id)


@router.post("/", response_model=Chat, status_code=status.HTTP_201_CREATED)
def create_chat(case_id: str, title: str, service: ChatService = Depends(get_chat_service)):
    return service.create_chat(case_id, title)


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(case_id: str, chat_id: str, service: ChatService = Depends(get_chat_service)):
    chat = service.get_chat(chat_id)
    if not chat or chat.case_id != case_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    service.delete_chat(chat_id)

