from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

class FlashcardSchema(BaseModel):
    id: uuid.UUID
    topic_id: uuid.UUID
    front: str
    back: str
    explanation: Optional[str]

    class Config:
        orm_mode = True


class TopicDependencySchema(BaseModel):
    from_topic_id: uuid.UUID
    to_topic_id: uuid.UUID

    class Config:
        orm_mode = True


class TopicSchema(BaseModel):
    id: uuid.UUID
    stack_id: uuid.UUID
    name: str
    description: Optional[str]
    
    prerequisites: List[TopicDependencySchema] = []
    dependents: List[TopicDependencySchema] = []
    flashcards: List[FlashcardSchema] = []

    class Config:
        orm_mode = True


class StudyStackSchema(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str]
    topics: List[TopicSchema] = []

    class Config:
        orm_mode = True


class UserSchema(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    name: str
    created_at: datetime
    study_stacks: List[StudyStackSchema] = []

    class Config:
        orm_mode = True
