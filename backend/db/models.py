import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    study_stacks: Mapped[List["StudyStack"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class StudyStack(Base):
    __tablename__ = "study_stacks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="study_stacks")
    topics: Mapped[List["Topic"]] = relationship(back_populates="stack", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stack_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study_stacks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    stack: Mapped["StudyStack"] = relationship(back_populates="topics")
    flashcards: Mapped[List["Flashcard"]] = relationship(back_populates="topic", cascade="all, delete-orphan")

    prerequisites: Mapped[List["TopicDependency"]] = relationship(
        foreign_keys="[TopicDependency.from_topic_id]",
        back_populates="from_topic",
        cascade="all, delete-orphan"
    )
    dependents: Mapped[List["TopicDependency"]] = relationship(
        foreign_keys="[TopicDependency.to_topic_id]",
        back_populates="to_topic",
        cascade="all, delete-orphan"
    )


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True
    )
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text)

    topic: Mapped["Topic"] = relationship(back_populates="flashcards")


class TopicDependency(Base):
    __tablename__ = "topic_dependencies"

    from_topic_id: Mapped[uuid.UUID] = mapped_column(
        "from", UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    to_topic_id: Mapped[uuid.UUID] = mapped_column(
        "to", UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True, index=True
    )

    from_topic: Mapped["Topic"] = relationship(
        foreign_keys=[from_topic_id], back_populates="prerequisites"
    )
    to_topic: Mapped["Topic"] = relationship(
        foreign_keys=[to_topic_id], back_populates="dependents"
    )
