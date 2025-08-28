import uuid
from typing import List
from fastapi import APIRouter
from api.auth import get_current_user
from db import crud
from db.database import get_db
from db.schemas import FlashcardSchema
from api.llm import extract_flashcards
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

router = APIRouter(prefix="/flashcards")

@router.post("/{topic_id}/generate", response_model=List[FlashcardSchema])
async def generate_flashcards(topic_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    topic = crud.get_topic_by_id(db, topic_id, user.id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found or does not belong to user")
    
    flashcards = await extract_flashcards(topic.name)
    print("Flashcards")
    print(flashcards)
    created_cards = []
    for card in flashcards:
        if "front" in card and "back" in card:
            created_card = crud.create_flashcard(db, topic_id, card["front"], card["back"], user.id)
            if created_card:
                created_cards.append(created_card)
    return created_cards

@router.get("/{topic_id}", response_model=List[FlashcardSchema])
async def get_flashcards_by_topic(topic_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return crud.get_flashcards_by_topic_id(db, topic_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Topic not found")

class CreateFlashcardRequest(BaseModel):
    front: str
    back: str

@router.post("/topics/{topic_id}/create_flashcard", response_model=FlashcardSchema)
async def add_flashcard(topic_id: uuid.UUID, body: CreateFlashcardRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not body.front or not body.back:
        raise HTTPException(status_code=400, detail="Front and back text are required")
    flashcard = crud.create_flashcard(db, topic_id, body.front, body.back, user.id)
    if flashcard:
        return flashcard
    else:
        raise HTTPException(status_code=404, detail="Topic not found or does not belong to user")
    

    
