import uuid
from typing import List
from fastapi import APIRouter
from api.auth import get_current_user
from db import crud
from db.database import get_db
from db.schemas import ExamSchema
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
async def generate_exam(stack_id: uuid.UUID, body: CreateExamRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    generated_exam = await create_multiple_choice_exam(body.title, body.topics, body.num_questions, body.prompt)
    created_exam = crud.create_exam(db, stack_id, body.title, user.id)
    if not created_exam:
        raise HTTPException(status_code=400, detail="Failed to create exam")

    for question in generated_exam:
        crud.create_question(db, created_exam.id, question["text"], question["choices"].values(), question["answer"], user.id)

    return created_exam

@router.get("/{exam_id}", response_model=ExamSchema)
async def get_exam(exam_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    exam = crud.get_exam(db, exam_id, user.id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.get("/{stack_id}/list", response_model=List[ExamSchema])
async def list_exams(stack_id: uuid.UUID, user = Depends(get_current_user), db: Session = Depends(get_db)):
    exams = crud.get_exams_by_stack(db, stack_id, user.id)
    return exams