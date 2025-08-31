import uuid
from typing import List
from fastapi import APIRouter
from api.auth import get_current_user
from db import crud
from db.database import get_db
from db.schemas import (
    ChatMessageSchema,
    ChatSessionSchema,
    ChatAttachmentSchema,
    ChatTagSchema,
)
from fastapi import Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel


router = APIRouter(prefix="/chat")


@router.post("/stacks/{stack_id}/sessions", response_model=ChatSessionSchema)
def create_chat_session(
    stack_id: uuid.UUID,
    title: str = "New Chat",
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return crud.create_chat_session(db, stack_id=stack_id, user_id=user_id, title=title)


@router.get("/stacks/{stack_id}/sessions", response_model=List[ChatSessionSchema])
def list_chat_sessions(
    stack_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return crud.list_chat_sessions(db, stack_id=stack_id, user_id=user_id)


@router.get("/sessions/{chat_id}", response_model=ChatSessionSchema)
def get_chat_session(
    chat_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return crud.get_chat_by_id(db, chat_id=chat_id, user_id=user_id)


@router.post("/sessions/{chat_id}")
def delete_chat_session(
    chat_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    crud.delete_chat_session(db, chat_id=chat_id, user_id=user_id)
    return {"detail": "Chat deleted"}


class MessageCreate(BaseModel):
    role: str
    content: str


@router.post("/sessions/{chat_id}/messages", response_model=ChatMessageSchema)
def add_message(
    chat_id: uuid.UUID,
    body: MessageCreate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return crud.add_message_to_chat(
        db, chat_id=chat_id, user_id=user_id, role=body.role, content=body.content
    )


class AttachmentCreate(BaseModel):
    type: str  # "exam_question", "flashcard", "topic"
    ref_id: uuid.UUID


@router.post("/sessions/{chat_id}/attachments", response_model=ChatAttachmentSchema)
def add_attachment(
    chat_id: uuid.UUID,
    body: AttachmentCreate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return crud.add_attachment_to_chat(
        db, chat_id=chat_id, user_id=user_id, type=body.type, ref_id=body.ref_id
    )


class TagCreate(BaseModel):
    tag: str


@router.post("/sessions/{chat_id}/tags", response_model=ChatTagSchema)
def add_tag(
    chat_id: uuid.UUID,
    body: TagCreate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return crud.add_tag_to_chat(db, chat_id=chat_id, user_id=user_id, tag=body.tag)
