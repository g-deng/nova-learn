from api.flashcard_algos import update_flashcard_stats_from_reviews, update_ewma_miss
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
from datetime import datetime, timezone

router = APIRouter(prefix="/flashcards")

@router.post("/{topic_id}/generate", response_model=List[FlashcardSchema])
async def generate_flashcards(topic_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    topic = crud.get_topic_by_id(db, topic_id, user.id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found or does not belong to user")

    existing_flashcards = crud.get_flashcards_by_topic_id(db, topic_id, user.id)
    avoid_fronts = [card.front for card in existing_flashcards]
    flashcards = await extract_flashcards(topic.name, avoid_fronts=avoid_fronts)
    print("Flashcards")
    print(flashcards)
    created_cards = []
    for card in flashcards:
        if "front" in card and "back" in card and "explanation" in card:
            created_card = crud.create_flashcard_with_explanation(db, topic_id, card["front"], card["back"], card["explanation"], user.id)
            if created_card:
                created_cards.append(created_card)
    return created_cards

@router.get("/{topic_id}", response_model=List[FlashcardSchema])
async def get_flashcards_by_topic(topic_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return crud.get_flashcards_by_topic_id(db, topic_id, user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Topic not found")

class AddReviewRequest(BaseModel):
    grade: int
    latency_ms: int | None = None

@router.post("/{flashcard_id}/add_review")
async def add_flashcard_review(flashcard_id: uuid.UUID, body: AddReviewRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not (0 <= body.grade <= 5):
        raise HTTPException(status_code=400, detail="Invalid grade value")
    flashcard = crud.get_flashcard_by_id(db, flashcard_id, user.id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found or does not belong to user")
    review = crud.create_flashcard_review(db, flashcard_id, body.grade, body.latency_ms or 0, user.id)
    update_ewma_miss(db, flashcard_id, is_miss=(body.grade < 4))
    update_flashcard_stats_from_reviews(db, flashcard_id)
    return {"review": review}

@router.get("/{stack_id}/learn", response_model=List[FlashcardSchema])
async def get_flashcards_due(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    flashcards = crud.get_flashcards_by_stack_id(db, stack_id, user.id)
    due_cards = []
    now = datetime.now(timezone.utc)
    for card in flashcards:
        stats = crud.get_flashcard_stats(db, card.id, user.id)
        if not stats or (stats.due_date and stats.due_date <= now):
            due_cards.append(card)
    print(len(due_cards), " cards due")
    return due_cards

@router.get("/{stack_id}/missed", response_model=List[FlashcardSchema])
async def get_missed_flashcards(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    flashcards = crud.get_flashcards_by_stack_id(db, stack_id, user.id)
    missed_cards = []
    for card in flashcards:
        stats = crud.get_flashcard_stats(db, card.id, user.id)
        print(f"{stats.ewma_miss if stats is not None else ''} for {card.front}")
        if stats and stats.ewma_miss is not None and stats.ewma_miss > 0.4:
            missed_cards.append(card)
    return missed_cards

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

@router.get("/stack/{stack_id}", response_model=List[FlashcardSchema])
async def get_flashcards_by_stack(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return crud.get_flashcards_by_stack_id(db, stack_id, user.id)
    except ValueError as e:
        print(e)
        raise HTTPException(status_code=404, detail="Stack not found")
