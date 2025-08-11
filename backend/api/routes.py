import uuid
from typing import List
from fastapi import APIRouter
from api.auth import get_current_user
from db import crud
from db.database import get_db
from db.schemas import (
    FlashcardSchema,
    StudyStackSchema,
    TopicSchema,
    TopicDependencySchema
)
from api.llm import extract_topics, infer_topic_dependencies
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

class SubmitTopicListRequest(BaseModel):
    stack_id: uuid.UUID
    topics: dict[str, str] # {name: description}

class SubmitTopicListResponse(BaseModel):
    topics: dict[str, uuid.UUID]  # {name: uuid}
    dependencies: List[List[str]]

class SubmitDependenciesRequest(BaseModel):
    dependencies: List[List[str]]

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

@router.post("/stacks/{stack_id}/generate_topics", response_model=dict[str, str])
async def generate_topics(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    stack_info = crud.get_stack_by_id(db, stack_id, user.id)
    if not stack_info:
        raise HTTPException(status_code=404, detail="Stack not found or does not belong to user")
    
    topics = await extract_topics(stack_info.name, stack_info.description)
    print("Topics")
    print(topics)
    if "topics" in topics:
        return topics["topics"]
    else:
        raise HTTPException(status_code=500, detail="Failed to extract topics")
    
@router.post("/stacks/{stack_id}/submit_topic_list")
async def submit_topic_list(body: SubmitTopicListRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    if "topics" in body.topics:
        raise HTTPException(status_code=400, detail="Topic list cannot be empty")
    
    for name in body.topics:
        crud.create_topic(db, body.stack_id, name, body.topics[name], user.id)

@router.post("/stacks/{stack_id}/infer_dependencies", response_model=List[List[str]])
async def infer_dependencies(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    topics = crud.get_topics_by_stack_id(db, stack_id, user.id)
    if not topics:
        raise HTTPException(status_code=404, detail="Stack not found or does not belong to user")
    dependencies = await infer_topic_dependencies([t.name for t in topics])

    if dependencies:
        return dependencies
    else:
        raise HTTPException(status_code=500, detail="Failed to infer topic dependencies")

@router.post("/stacks/{stack_id}/submit_dependencies")
async def submit_dependencies(body: SubmitDependenciesRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not body.dependencies:
        raise HTTPException(status_code=400, detail="Dependencies cannot be empty")
    
    for dep in body.dependencies:
        if len(dep) != 2:
            raise HTTPException(status_code=400, detail="Each dependency must be a pair of topics")
    
    for dep in body.dependencies:
        try:
            if not crud.add_topic_dependency_by_name(db, dep[0], dep[1], user.id):
                raise HTTPException(status_code=404, detail="One or more topics not found or do not belong to user")
        except Exception as e:
            print(f"Error adding dependency {dep}: {e}")
    
    return

@router.post("/add_stack", response_model=StudyStackSchema)
async def add_stack(stack_data: CreateStackRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not stack_data.name:
        raise HTTPException(status_code=400, detail="Stack name is required")
    stack = crud.create_stack(db, user.id, stack_data.name, stack_data.description)
    return stack

@router.get("/stacks/{stack_id}", response_model=StudyStackSchema)
async def get_stack(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    stack = crud.get_stack_by_id(db, stack_id, user.id)
    if stack:
        return stack
    raise HTTPException(status_code=404, detail="Stack not found or does not belong to user")

@router.get("/stacks/{stack_id}/topics", response_model=List[TopicSchema])
async def get_topics(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    print("Fetching topics")
    topics = crud.get_topics_by_stack_id(db, stack_id, user.id)
    if topics:
        return topics
    raise HTTPException(status_code=404, detail="Stack not found")

@router.get("/stacks/{stack_id}/dependencies", response_model=List[TopicDependencySchema])
async def get_dependencies(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    print("Fetching dependencies")
    dependencies = crud.get_topic_dependencies_by_stack_id(db, stack_id, user.id)
    if dependencies:
        return dependencies
    raise HTTPException(status_code=404, detail="No dependencies found for this stack")

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