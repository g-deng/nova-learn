from fastapi import APIRouter
from auth import get_current_user
from db import crud, schemas

router = APIRouter(prefix="/api")

@router.get("/flashcards")
def get_flashcards():
    return [{"front": "What is AI?", "back": "Artificial Intelligence"}]

@router.get("/stacks", response_model=List[StudyStackSchema])
async def get_stacks(user = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_stacks_by_user_id(db, user["id"])

@router.get("/stacks/{stack_id}/topics", response_model=List[TopicSchema])
async def get_topics(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    topics = crud.get_topics_by_stack_id(db, stack_id, user["id"])
    if topics:
        return topics
    raise HTTPException(status_code=404, detail="Stack not found")

@router.get("/topics/{topic_id}/flashcards", response_model=List[FlashcardSchema])
async def get_flashcards_by_topic(topic_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    flashcards = crud.get_flashcards_by_topic_id(db, topic_id, user["id"])
    if flashcards:
        return flashcards
    raise HTTPException(status_code=404, detail="Topic not found")