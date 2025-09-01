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
        from_attributes = True


class TopicDependencySchema(BaseModel):
    from_topic_id: uuid.UUID
    to_topic_id: uuid.UUID

    class Config:
        from_attributes = True


class TopicSchema(BaseModel):
    id: uuid.UUID
    stack_id: uuid.UUID
    name: str
    description: Optional[str]

    prerequisites: List[TopicDependencySchema] = []
    dependents: List[TopicDependencySchema] = []
    flashcards: List[FlashcardSchema] = []

    class Config:
        from_attributes = True


class StudyStackSchema(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str]
    topics: List[TopicSchema] = []

    class Config:
        from_attributes = True


class UserSchema(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    name: str
    created_at: datetime
    study_stacks: List[StudyStackSchema] = []

    class Config:
        from_attributes = True


class QuestionSchema(BaseModel):
    id: uuid.UUID
    exam_id: uuid.UUID
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    answer: str
    explanation: Optional[str]
    order: int

    class Config:
        from_attributes = True


class ExamSchema(BaseModel):
    id: uuid.UUID
    stack_id: uuid.UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class ExamAttemptSchema(BaseModel):
    id: uuid.UUID
    exam_id: uuid.UUID
    completed_at: datetime
    scored_questions: Optional[int] = None
    score: Optional[int] = None

    class Config:
        from_attributes = True


class ExamInfoSchema(BaseModel):
    id: uuid.UUID
    stack_id: uuid.UUID
    name: str
    created_at: datetime
    topics: List[str]
    best_attempt: Optional[ExamAttemptSchema] = None

    class Config:
        from_attributes = True


class QuestionAttemptSchema(BaseModel):
    id: uuid.UUID
    exam_attempt_id: uuid.UUID
    question_id: uuid.UUID
    selected_option: Optional[str] = None
    is_correct: bool
    scored: bool = True
    manual_credit: bool = False


class ChatMessageSchema(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    role: str  # "system" | "user" | "assistant"
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatAttachmentSchema(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    type: str  # "exam_question" | "flashcard" | "topic"
    ref_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ChatTagSchema(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    tag: str

    class Config:
        from_attributes = True


class ChatSessionSchema(BaseModel):
    id: uuid.UUID
    stack_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime

    messages: List[ChatMessageSchema] = []
    attachments: List[ChatAttachmentSchema] = []
    tags: List[ChatTagSchema] = []

    class Config:
        from_attributes = True
