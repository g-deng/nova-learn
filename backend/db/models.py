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
    exams: Mapped[List["Exam"]] = relationship("Exam", back_populates="stack", cascade="all, delete-orphan")


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
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="topic")


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

class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    stack_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("study_stacks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now(timezone.utc)
    )

    stack: Mapped["StudyStack"] = relationship(back_populates="exams")
    questions: Mapped[List["Question"]] = relationship(
        back_populates="exam", cascade="all, delete-orphan"
    )
    exam_attempts: Mapped[List["ExamAttempt"]] = relationship(
        back_populates="exam", cascade="all, delete-orphan"
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    option_a: Mapped[str] = mapped_column(Text, nullable=False)
    option_b: Mapped[str] = mapped_column(Text, nullable=False)
    option_c: Mapped[str] = mapped_column(Text, nullable=False)
    option_d: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(String(1), nullable=False) # 'A', 'B', 'C', or 'D'
    explanation: Mapped[str | None] = mapped_column(Text)
    order: Mapped[int] = mapped_column(nullable=False, default=0)

    exam: Mapped["Exam"] = relationship(back_populates="questions")

    topic_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    topic: Mapped["Topic"] = relationship(back_populates="questions")

    question_attempts: Mapped[List["QuestionAttempt"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )

class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.now(timezone.utc)
    )
    scored_questions: Mapped[int | None] = mapped_column(nullable=True)
    score: Mapped[int | None] = mapped_column(nullable=True)

    exam: Mapped["Exam"] = relationship(back_populates="exam_attempts")
    question_attempts: Mapped[List["QuestionAttempt"]] = relationship(
        back_populates="exam_attempt", cascade="all, delete-orphan"
    )

class QuestionAttempt(Base):
    __tablename__ = "question_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    exam_attempt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exam_attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    selected_option: Mapped[str | None] = mapped_column(String(1), nullable=True)
    is_correct: Mapped[bool] = mapped_column(nullable=False)
    scored: Mapped[bool] = mapped_column(nullable=False, default=True)
    manual_credit: Mapped[bool] = mapped_column(nullable=False, default=False)

    exam_attempt: Mapped["ExamAttempt"] = relationship(back_populates="question_attempts")
    question: Mapped["Question"] = relationship(back_populates="question_attempts")
