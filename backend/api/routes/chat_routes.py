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
from api import llm

router = APIRouter(prefix="/chats", tags=["chats"])


@router.post("/stacks/{stack_id}/create", response_model=ChatSessionSchema)
def create_chat_session(
    stack_id: uuid.UUID,
    title: str = "New Chat",
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return crud.create_chat_session(db, stack_id=stack_id, user_id=user.id, title=title)


@router.get("/stacks/{stack_id}/sessions", response_model=List[ChatSessionSchema])
def list_chat_sessions(
    stack_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return crud.list_chat_sessions(db, stack_id=stack_id, user_id=user.id)


@router.get("/sessions/{chat_id}", response_model=ChatSessionSchema)
def get_chat_session(
    chat_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return crud.get_chat_by_id(db, chat_id=chat_id, user_id=user.id)


@router.post("/sessions/{chat_id}/delete")
def delete_chat_session(
    chat_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    crud.delete_chat_session(db, chat_id=chat_id, user_id=user.id)
    return {"detail": "Chat deleted"}


class MessageCreate(BaseModel):
    role: str
    content: str


@router.post("/sessions/{chat_id}/messages", response_model=ChatMessageSchema)
def add_message(
    chat_id: uuid.UUID,
    body: MessageCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return crud.add_message_to_chat(
        db, chat_id=chat_id, user_id=user.id, role=body.role, content=body.content
    )


class AttachmentCreate(BaseModel):
    type: str  # "exam_question", "flashcard", "topic"
    ref_id: uuid.UUID


@router.post("/sessions/{chat_id}/attachments", response_model=ChatAttachmentSchema)
def add_attachment(
    chat_id: uuid.UUID,
    body: AttachmentCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return crud.add_attachment_to_chat(
        db, chat_id=chat_id, user_id=user.id, type=body.type, ref_id=body.ref_id
    )


class AttachmentDelete(BaseModel):
    attachment_id: uuid.UUID


@router.post("/sessions/{chat_id}/delete_attachment")
def delete_attachment(
    chat_id: uuid.UUID,
    body: AttachmentDelete,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    crud.remove_attachment_from_chat(
        db, chat_id=chat_id, user_id=user.id, attachment_id=body.attachment_id
    )
    return {"detail": "Attachment deleted"}


class TagCreate(BaseModel):
    tag: str


@router.post("/sessions/{chat_id}/tags", response_model=ChatTagSchema)
def add_tag(
    chat_id: uuid.UUID,
    body: TagCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return crud.add_tag_to_chat(db, chat_id=chat_id, user_id=user.id, tag=body.tag)


class ChatResponse(BaseModel):
    message: ChatMessageSchema
    title: str


@router.post("/sessions/{chat_id}/llm", response_model=ChatResponse)
async def generate_response(
    chat_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    chat = crud.get_chat_by_id(db, chat_id, user.id)

    messages = [{"role": m.role, "content": m.content} for m in chat.messages]
    attachments = crud.hydrate_attachments(db, chat_id, user.id)

    if len(messages) <= 1:
        chat.title = await llm.generate_chat_title(messages, attachments)
        db.commit()

    response_text = await llm.chat_with_context(messages, attachments)
    assistant_msg = crud.add_message_to_chat(
        db, chat_id, user.id, role="assistant", content=response_text
    )
    return ChatResponse(
        message=ChatMessageSchema.model_validate(assistant_msg), title=chat.title
    )
