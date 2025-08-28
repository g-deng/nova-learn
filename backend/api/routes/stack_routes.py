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
    new_topics: dict[str, str] # {name: description}
    old_topics: dict[uuid.UUID, tuple[str, str]]  # {id: (name, description)}
    deleted_topics: List[uuid.UUID]

class SubmitDependenciesRequest(BaseModel):
    new_dependencies: List[tuple[str, str]]  # list of [from, to]
    old_dependencies: dict[str, List[str]]  # {id: [from, to]}
    deleted_dependencies: List[str]  # list of ids

class CreateStackRequest(BaseModel):
    name: str
    description: str

router = APIRouter(prefix="/stacks")

@router.get("/", response_model=List[StudyStackSchema])
async def get_stacks(user = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_stacks_by_user_id(db, user.id)

@router.post("/{stack_id}/generate_topics", response_model=dict[str, str])
async def generate_topics(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    stack_info = crud.get_stack_by_id(db, stack_id, user.id)
    if not stack_info:
        raise HTTPException(status_code=404, detail="Stack not found or does not belong to user")
    
    existing_topics = crud.get_topics_by_stack_id(db, stack_id, user.id)
    avoid_topics = [t.name for t in existing_topics]
    
    topics = await extract_topics(stack_info.name, stack_info.description, avoid_topics)
    print("Topics")
    print(topics)
    if "topics" in topics:
        return topics["topics"]
    else:
        raise HTTPException(status_code=500, detail="Failed to extract topics")
    
@router.post("/{stack_id}/submit_topic_list", response_model=dict[str, uuid.UUID])
async def submit_topic_list(stack_id: uuid.UUID, body: SubmitTopicListRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    out = {}
    for name, description in body.new_topics.items():
        topic = crud.create_topic(db, body.stack_id, name, description, user.id)
        out[name] = topic.id

    for topic_id, (name, description) in body.old_topics.items():
        crud.update_topic(db, topic_id, name, description, stack_id, user.id)

    for topic_id in body.deleted_topics:
        crud.delete_topic(db, topic_id, user.id)

    return out

@router.post("/{stack_id}/infer_dependencies", response_model=List[List[str]])
async def infer_dependencies(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    topics = crud.get_topics_by_stack_id(db, stack_id, user.id)
    if not topics:
        raise HTTPException(status_code=404, detail="Stack not found or does not belong to user")
    print([t.name for t in topics])
    dependencies = await infer_topic_dependencies([t.name for t in topics])

    if dependencies:
        return dependencies
    else:
        raise HTTPException(status_code=500, detail="Failed to infer topic dependencies")

@router.post("/{stack_id}/submit_dependencies", response_model=dict[str, tuple[uuid.UUID, uuid.UUID]])
async def submit_dependencies(body: SubmitDependenciesRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    new_ids = {}
    for dep in body.new_dependencies:
        try:
            added_dep = crud.add_topic_dependency_by_name(db, dep[0], dep[1], user.id)
            if not added_dep:
                raise HTTPException(status_code=404, detail="One or more topics not found or do not belong to user")
            new_ids[dep[0] + "," + dep[1]] = (added_dep.from_topic_id, added_dep.to_topic_id)
        except Exception as e:
            print(f"Error adding dependency {dep}: {e}")

    for ids, (new_from, new_to) in body.old_dependencies.items():
        from_id, to_id = ids.split(",")
        from_id = uuid.UUID(from_id)
        to_id = uuid.UUID(to_id)
        try:
            if not crud.update_topic_dependency(db, from_id, to_id, new_from, new_to, user.id):
                raise HTTPException(status_code=404, detail="One or more topics not found or do not belong to user")
        except Exception as e:
            print(f"Error updating dependency: {e}")

    for ids in body.deleted_dependencies:
        from_id, to_id = ids.split(",")
        from_id = uuid.UUID(from_id)
        to_id = uuid.UUID(to_id)
        try:
            if not crud.delete_topic_dependency(db, from_id, to_id, user.id):
                raise HTTPException(status_code=404, detail="Dependency not found or does not belong to user")
        except Exception as e:
            print(f"Error deleting dependency: {e}")
    
    return new_ids

@router.post("/add_stack", response_model=StudyStackSchema)
async def add_stack(stack_data: CreateStackRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not stack_data.name:
        raise HTTPException(status_code=400, detail="Stack name is required")
    stack = crud.create_stack(db, user.id, stack_data.name, stack_data.description)
    return stack

@router.get("/{stack_id}", response_model=StudyStackSchema)
async def get_stack(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    stack = crud.get_stack_by_id(db, stack_id, user.id)
    if stack:
        return stack
    raise HTTPException(status_code=404, detail="Stack not found or does not belong to user")

@router.get("/{stack_id}/topics", response_model=List[TopicSchema])
async def get_topics(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    print("Fetching topics")
    topics = crud.get_topics_by_stack_id(db, stack_id, user.id)
    if crud.get_stack_by_id(db, stack_id, user.id):
        return topics
    raise HTTPException(status_code=404, detail="Stack not found")


@router.get("/{stack_id}/dependencies", response_model=List[TopicDependencySchema])
async def get_dependencies(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    print("Fetching dependencies")
    dependencies = crud.get_topic_dependencies_by_stack_id(db, stack_id, user.id)
    if crud.get_stack_by_id(db, stack_id, user.id):
        return dependencies
    raise HTTPException(status_code=404, detail="No dependencies found for this stack")

@router.post("/{stack_id}/add_topic", response_model=TopicSchema)
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