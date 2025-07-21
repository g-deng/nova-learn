import uuid
from typing import List
from fastapi import APIRouter
from api.auth import get_current_user
from db import crud
from db.database import get_db
from db.schemas import (
    FlashcardSchema,
    StudyStackSchema,
    TopicSchema
)
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

class CreateStackRequest(BaseModel):
    name: str
    description: str

router = APIRouter(prefix="/api")

@router.get("/flashcards")
def get_flashcards():
    return [{"front": "What is AI?", "back": "Artificial Intelligence"}]

@router.get("/stacks", response_model=List[StudyStackSchema])
async def get_stacks(user = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_stacks_by_user_id(db, user.id)

@router.post("/add_stack", response_model=StudyStackSchema)
async def add_stack(stack_data: CreateStackRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    print("hi")
    print(stack_data.name)
    print(stack_data.description)
    print(user.id)
    if not stack_data.name:
        raise HTTPException(status_code=400, detail="Stack name is required")
    stack = crud.create_stack(db, user.id, stack_data.name, stack_data.description)
    return stack

@router.get("/stacks/{stack_id}/topics", response_model=List[TopicSchema])
async def get_topics(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    topics = crud.get_topics_by_stack_id(db, stack_id, user.id)
    if topics:
        return topics
    raise HTTPException(status_code=404, detail="Stack not found")

@router.post("/stacks/{stack_id}/add_topic", response_model=TopicSchema)
async def add_topic(stack_id: uuid.UUID, name: str, description: str, user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not name:
        raise HTTPException(status_code=400, detail="Topic name is required")
    topic = crud.create_topic(db, stack_id, name, description, user.id)
    if topic:
        return topic
    else:
        raise HTTPException(status_code=404, detail="Stack not found or does not belong to user")

@router.get("/topics/{topic_id}/flashcards", response_model=List[FlashcardSchema])
async def get_flashcards_by_topic(topic_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    flashcards = crud.get_flashcards_by_topic_id(db, topic_id, user.id)
    if flashcards:
        return flashcards
    raise HTTPException(status_code=404, detail="Topic not found")

@router.post("/topics/{topic_id}/add_flashcard", response_model=FlashcardSchema)
async def add_flashcard(topic_id: uuid.UUID, front: str, back: str, user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not front or not back:
        raise HTTPException(status_code=400, detail="Front and back text are required")
    flashcard = crud.create_flashcard(db, topic_id, front, back, user.id)
    if flashcard:
        return flashcard
    else:
        raise HTTPException(status_code=404, detail="Topic not found or does not belong to user")