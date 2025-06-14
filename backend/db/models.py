import uuid
from sqlalchemy import Column, ForeignKey, Text, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    study_stacks = relationship("StudyStack", back_populates="user", cascade="all, delete-orphan")


class StudyStack(Base):
    __tablename__ = "study_stacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="study_stacks")
    topics = relationship("Topic", back_populates="stack", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stack_id = Column(UUID(as_uuid=True), ForeignKey("study_stacks.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)

    stack = relationship("StudyStack", back_populates="topics")
    flashcards = relationship("Flashcard", back_populates="topic", cascade="all, delete-orphan")
    
    # relationships for dependencies (self-referencing)
    prerequisites = relationship(
        "TopicDependency",
        foreign_keys="[TopicDependency.from_topic_id]",
        back_populates="from_topic",
        cascade="all, delete-orphan"
    )
    dependents = relationship(
        "TopicDependency",
        foreign_keys="[TopicDependency.to_topic_id]",
        back_populates="to_topic",
        cascade="all, delete-orphan"
    )


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    explanation = Column(Text)

    topic = relationship("Topic", back_populates="flashcards")


class TopicDependency(Base):
    __tablename__ = "topic_dependencies"

    from_topic_id = Column("from", UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True)
    to_topic_id = Column("to", UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True)

    from_topic = relationship("Topic", foreign_keys=[from_topic_id], back_populates="prerequisites")
    to_topic = relationship("Topic", foreign_keys=[to_topic_id], back_populates="dependents")
