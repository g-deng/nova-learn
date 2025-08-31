import uuid
from typing import List
from fastapi import APIRouter
from api.auth import get_current_user
from db import crud
from db.database import get_db
from db.schemas import (
    ExamAttemptSchema,
    ExamSchema,
    ExamInfoSchema,
    QuestionAttemptSchema,
    QuestionSchema,
)
from api.llm import create_multiple_choice_exam
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

router = APIRouter(prefix="/exams")


class CreateExamRequest(BaseModel):
    title: str
    prompt: str
    num_questions: int
    topics: List[str]


@router.post("/{stack_id}/generate", response_model=ExamSchema)
async def generate_exam(
    stack_id: uuid.UUID,
    body: CreateExamRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    generated_exam = await create_multiple_choice_exam(
        body.title, body.topics, body.num_questions, body.prompt
    )
    created_exam = crud.create_exam(db, stack_id, body.title, user.id)
    if not created_exam:
        raise HTTPException(status_code=400, detail="Failed to create exam")

    for question in generated_exam:
        topic = crud.get_topic_by_name(db, question["topic_name"], user.id)
        crud.create_question(
            db,
            created_exam.id,
            question["text"],
            [
                question["choices"]["A"],
                question["choices"]["B"],
                question["choices"]["C"],
                question["choices"]["D"],
            ],
            question["answer"],
            topic.id,
            user.id,
        )

    return created_exam


@router.get("/{exam_id}", response_model=ExamSchema)
async def get_exam(
    exam_id: uuid.UUID, user=Depends(get_current_user), db: Session = Depends(get_db)
):
    exam = crud.get_exam_by_id(db, exam_id, user.id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


@router.get("/{exam_id}/info", response_model=ExamInfoSchema)
async def get_exam_info(
    exam_id: uuid.UUID, user=Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        exam_info = crud.get_exam_with_topics(db, exam_id, user.id)
        return exam_info
    except ValueError:
        raise HTTPException(status_code=404, detail="Exam not found")


@router.get("/{stack_id}/list", response_model=List[ExamInfoSchema])
async def list_exams(
    stack_id: uuid.UUID, user=Depends(get_current_user), db: Session = Depends(get_db)
):
    exams = crud.get_exams_by_stack_with_topics(db, stack_id, user.id)
    return exams


@router.get("/{exam_id}/questions", response_model=List[QuestionSchema])
async def get_exam_questions(
    exam_id: uuid.UUID, user=Depends(get_current_user), db: Session = Depends(get_db)
):
    questions = crud.get_questions_by_exam(db, exam_id, user.id)
    return questions


@router.post("/{exam_id}/delete", response_model=bool)
async def delete_exam(
    exam_id: uuid.UUID, user=Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        return crud.delete_exam(db, exam_id, user.id)
    except ValueError:
        raise HTTPException(status_code=500, detail="Exam could not be deleted")


@router.post("/question/{question_id}/delete", response_model=bool)
async def delete_question(
    question_id: uuid.UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.delete_question(db, question_id, user.id)


@router.post("/attempt/{exam_attempt_id}/score", response_model=ExamAttemptSchema)
async def score_exam_attempt(
    exam_attempt_id: uuid.UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return crud.score_exam_attempt(db, exam_attempt_id, user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Exam attempt not found")


@router.post("/attempt/{exam_attempt_id}/delete")
async def delete_exam_attempt(
    exam_attempt_id: uuid.UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return crud.delete_exam_attempt(db, exam_attempt_id, user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Exam attempt not found")


class UpdateAttemptRequest(BaseModel):
    question_attempts: List[
        dict
    ]  # dicts contain question_attempt_id, scored, and manual_credit


@router.post("/attempt/{exam_attempt_id}/update_scoring")
async def update_exam_attempt(
    exam_attempt_id: uuid.UUID,
    body: UpdateAttemptRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        for qa in body.question_attempts:
            crud.update_question_attempt_scoring(
                db,
                qa["question_attempt_id"],
                qa["scored"],
                qa["manual_credit"],
                user.id,
            )
        return crud.score_exam_attempt(db, exam_attempt_id, user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Exam attempt not found")


class UploadAttemptRequest(BaseModel):
    question_attempts: List[dict]  # dicts contain question_id and selected_option


@router.post("/{exam_id}/upload_attempt", response_model=ExamAttemptSchema)
async def upload_exam_attempt(
    exam_id: uuid.UUID,
    body: UploadAttemptRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        exam_attempt = crud.create_exam_attempt(db, exam_id, user.id)
        for question in body.question_attempts:
            crud.create_question_attempt(
                db,
                exam_attempt.id,
                question["question_id"],
                question["selected_option"],
                user.id,
            )
        return crud.score_exam_attempt(db, exam_attempt.id, user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Exam not found")


@router.get("/{exam_id}/attempts", response_model=List[ExamAttemptSchema])
async def get_exam_attempts(
    exam_id: uuid.UUID, user=Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        attempts = crud.get_exam_attempts(db, exam_id, user.id)
        return attempts
    except ValueError:
        raise HTTPException(status_code=404, detail="Exam not found")


@router.get(
    "/attempt/{attempt_id}/questions", response_model=List[QuestionAttemptSchema]
)
async def get_exam_question_attempts(
    attempt_id: uuid.UUID, user=Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        question_attempts = crud.get_question_attempts_by_exam_attempt(
            db, attempt_id, user.id
        )
        return question_attempts
    except ValueError:
        raise HTTPException(status_code=404, detail="Exam attempt not found")
