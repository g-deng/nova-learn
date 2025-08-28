import uuid
from typing import List
from sqlalchemy.orm import Session
from db.models import Exam, ExamAttempt, Question, QuestionAttempt, User, StudyStack, Topic, Flashcard, TopicDependency

# USERS
def get_user_by_id(db: Session, user_id: uuid.UUID):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_firebase_uid(db: Session, firebase_uid: str):
    return db.query(User).filter(User.firebase_uid == firebase_uid).first()

def create_user(db: Session, firebase_uid: str, name: str):
    user = User(firebase_uid=firebase_uid, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# STACKS
def get_stacks_by_user_id(db: Session, user_id: uuid.UUID):
    return db.query(StudyStack).filter(StudyStack.user_id == user_id).all()

def get_stack_by_id(db: Session, stack_id: uuid.UUID, user_id: uuid.UUID):
    stack = db.query(StudyStack).filter(StudyStack.id == stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Stack not found or does not belong to user")
    return stack

def create_stack(db: Session, user_id: uuid.UUID, name: str, description: str):
    stack = StudyStack(user_id=user_id, name=name, description=description)
    db.add(stack)
    db.commit()
    db.refresh(stack)
    return stack

# TOPICS

def get_topics_by_stack_id(db: Session, stack_id: uuid.UUID, user_id: uuid.UUID):
    get_stack_by_id(db, stack_id, user_id)
    return db.query(Topic).filter(Topic.stack_id == stack_id).all()

def create_topic(db: Session, stack_id: uuid.UUID, name: str, description: str, user_id: uuid.UUID):
    get_stack_by_id(db, stack_id, user_id)
    topic = Topic(stack_id=stack_id, name=name, description=description)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

def get_topic_by_id(db: Session, topic_id: uuid.UUID, user_id: uuid.UUID):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    get_stack_by_id(db, topic.stack_id, user_id)
    return topic

def get_topic_by_name(db: Session, topic_name: str, user_id: uuid.UUID):
    topic = db.query(Topic).filter(Topic.name == topic_name).first()
    if not topic:
        raise ValueError("Topic not found")
    get_stack_by_id(db, topic.stack_id, user_id)
    return topic

def update_topic(db: Session, topic_id: uuid.UUID, name: str, description: str, stack_id: uuid.UUID, user_id: uuid.UUID):
    topic = get_topic_by_id(db, topic_id, user_id)
    if name != topic.name:
        topic.name = name
    if description != topic.description:
        topic.description = description
    db.commit()
    db.refresh(topic)
    return topic

def delete_topic(db: Session, topic_id: uuid.UUID, user_id: uuid.UUID):
    topic = get_topic_by_id(db, topic_id, user_id)
    db.delete(topic)
    db.commit()
    return True

# FLASHCARDS

def get_flashcard_by_id(db: Session, flashcard_id: uuid.UUID, user_id: uuid.UUID):
    flashcard = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if not flashcard:
        raise ValueError("Flashcard not found")
    get_topic_by_id(db, flashcard.topic_id, user_id)
    return flashcard

def get_flashcards_by_stack_id(db: Session, stack_id: uuid.UUID, user_id: uuid.UUID):
    get_stack_by_id(db, stack_id, user_id)
    return db.query(Flashcard).join(Topic).filter(Topic.stack_id == stack_id).all()

def get_flashcards_by_topic_id(db: Session, topic_id: uuid.UUID, user_id: uuid.UUID):
    get_topic_by_id(db, topic_id, user_id)
    return db.query(Flashcard).filter(Flashcard.topic_id == topic_id).all()

def create_flashcard(db: Session, topic_id: uuid.UUID, front: str, back: str, user_id: uuid.UUID):
    get_topic_by_id(db, topic_id, user_id)
    flashcard = Flashcard(topic_id=topic_id, front=front, back=back)
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)
    return flashcard

def create_flashcards_bulk(db: Session, topic_id: uuid.UUID, fronts: list[str], backs: List[str], user_id: uuid.UUID):
    get_topic_by_id(db, topic_id, user_id)
    
    if len(fronts) != len(backs): return False
    flashcards = []
    for (front, back) in zip(fronts, backs):
        flashcards.append(Flashcard(topic_id=topic_id, front=front, back=back))
    
    db.add_all(flashcards)
    db.commit()
    return True

def edit_flashcard(db: Session, id: uuid.UUID, front: str, back: str, user_id: uuid.UUID):
    flashcard = get_flashcard_by_id(db, id, user_id)
    if front != flashcard.front:
        flashcard.front = front
    if back != flashcard.back:
        flashcard.back = back
    db.commit()
    db.refresh(flashcard)
    return flashcard

def delete_flashcard(db: Session, id: uuid.UUID, user_id: uuid.UUID):
    flashcard = get_flashcard_by_id(db, id, user_id)
    db.delete(flashcard)
    db.commit()
    return True

def add_flashcard_explanation(db: Session, id: uuid.UUID, explanation: str, user_id: uuid.UUID):
    flashcard = get_flashcard_by_id(db, id, user_id)
    flashcard.explanation = explanation
    db.commit()
    db.refresh(flashcard)
    return flashcard
    
# DEPENDENCIES

def get_topic_dependencies_by_stack_id(db: Session, stack_id: uuid.UUID, user_id: uuid.UUID):
    stack = get_stack_by_id(db, stack_id, user_id)
    return db.query(TopicDependency).filter(
        (TopicDependency.from_topic.has(stack_id=stack_id)) | 
        (TopicDependency.to_topic.has(stack_id=stack_id))
    ).all()

def get_prerequisite_topic_ids(db: Session, topic_id: uuid.UUID, user_id: uuid.UUID):
    get_topic_by_id(db, topic_id, user_id)
    dependencies = db.query(TopicDependency).filter(TopicDependency.to_topic_id == topic_id).all()
    return [dep.from_topic_id for dep in dependencies]

def get_postrequisite_topic_ids(db: Session, topic_id: uuid.UUID, user_id: uuid.UUID):
    get_topic_by_id(db, topic_id, user_id)
    dependencies = db.query(TopicDependency).filter(TopicDependency.from_topic_id == topic_id).all()
    return [dep.to_topic_id for dep in dependencies]

def add_topic_dependency(db: Session, from_topic_id: uuid.UUID, to_topic_id: uuid.UUID, user_id: uuid.UUID):
    get_topic_by_id(db, from_topic_id, user_id)
    get_topic_by_id(db, to_topic_id, user_id)
    
    topic_dependency = TopicDependency(from_topic_id=from_topic_id, to_topic_id=to_topic_id)
    db.add(topic_dependency)
    db.commit()
    return True
    

def add_topic_dependency_by_name(db: Session, from_topic_name: str, to_topic_name: str, user_id: uuid.UUID):
    from_topic = db.query(Topic).filter(Topic.name == from_topic_name).first()
    to_topic = db.query(Topic).filter(Topic.name == to_topic_name).first()
    
    if not from_topic or not to_topic:
        raise ValueError("Topic not found or does not belong to user")
    
    if from_topic.stack.user_id != user_id or to_topic.stack.user_id != user_id:
        raise ValueError("One or more topics do not belong to user")
    
    if from_topic and to_topic:
        topic_dependency = TopicDependency(from_topic_id=from_topic.id, to_topic_id=to_topic.id)
        db.add(topic_dependency)
        db.commit()
        return topic_dependency
    else:
        return None
    
def update_topic_dependency(db: Session, from_id: uuid.UUID, to_id: uuid.UUID, new_from: str, new_to: str, user_id: uuid.UUID):
    dependency = db.query(TopicDependency).filter(TopicDependency.from_topic_id == from_id and TopicDependency.to_topic_id == to_id).first()
    if not dependency:
        raise ValueError("Dependency not found")
    
    from_topic = db.query(Topic).filter(Topic.name == new_from, Topic.stack.user_id == user_id).first()
    to_topic = db.query(Topic).filter(Topic.id == new_to, Topic.stack.user_id == user_id).first()

    if not from_topic or not to_topic:
        raise ValueError("One or more topics not found or do not belong to user")
    
    dependency.from_topic_id = from_topic.id
    dependency.to_topic_id = to_topic.id
    db.commit()
    return True

def delete_topic_dependency(db: Session, from_id: uuid.UUID, to_id: uuid.UUID, user_id: uuid.UUID):
    dependency = db.query(TopicDependency).filter(TopicDependency.from_topic_id == from_id and TopicDependency.to_topic_id == to_id).first()
    if not dependency:
        raise ValueError("Dependency not found")
    
    if dependency.from_topic.stack.user_id != user_id or dependency.to_topic.stack.user_id != user_id:
        raise ValueError("Dependency does not belong to user")
    
    db.delete(dependency)
    db.commit()
    return True

# EXAMS

def create_exam(db: Session, stack_id: uuid.UUID, name: str, user_id: uuid.UUID):
    get_stack_by_id(db, stack_id, user_id)
    exam = Exam(stack_id=stack_id, name=name)
    db.add(exam)
    db.commit()
    return exam

def get_exams_by_stack(db: Session, stack_id: uuid.UUID, user_id: uuid.UUID):
    get_stack_by_id(db, stack_id, user_id)
    return db.query(Exam).filter(Exam.stack_id == stack_id).all()

def get_exams_by_stack_with_topics(db: Session, stack_id: uuid.UUID, user_id: uuid.UUID):
    exams = get_exams_by_stack(db, stack_id, user_id)
    result = []
    for exam in exams:
        topics = (
            db.query(Topic.name)
            .join(Question, Question.topic_id == Topic.id)
            .filter(Question.exam_id == exam.id)
            .distinct()
            .all()
        )
        topic_names = [t[0] for t in topics]
        exam_dict = exam.__dict__.copy()
        exam_dict['topics'] = topic_names
        result.append(exam_dict)
    return result

def get_exam_by_id(db: Session, exam_id: uuid.UUID, user_id: uuid.UUID):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise ValueError("Exam not found")
    get_stack_by_id(db, exam.stack_id, user_id)
    return exam

def delete_exam(db: Session, exam_id: uuid.UUID, user_id: uuid.UUID):
    exam = get_exam_by_id(db, exam_id, user_id)
    db.delete(exam)
    db.commit()
    return True

# QUESTIONS

def create_question(db: Session, exam_id: uuid.UUID, text: str, options: list[str], answer: str, topic_id: uuid.UUID, user_id: uuid.UUID):
    get_exam_by_id(db, exam_id, user_id)
    if answer not in ['A', 'B', 'C', 'D']:
        raise ValueError("Invalid answer option")

    question = Question(
        exam_id=exam_id,
        text=text,
        option_a=options[0],
        option_b=options[1],
        option_c=options[2],
        option_d=options[3],
        answer=answer,
        topic_id=topic_id
    )
    db.add(question)
    db.commit()
    return question

def get_question_by_id(db: Session, question_id: uuid.UUID, user_id: uuid.UUID):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise ValueError("Question not found")
    get_exam_by_id(db, question.exam_id, user_id)
    return question

def update_question(db: Session, question_id: uuid.UUID, text: str, options: list[str], answer: str, user_id: uuid.UUID):
    question = get_question_by_id(db, question_id, user_id)
    
    if answer not in ['A', 'B', 'C', 'D']:
        raise ValueError("Invalid answer option")

    question.text = text
    question.option_a = options[0]
    question.option_b = options[1]
    question.option_c = options[2]
    question.option_d = options[3]
    question.answer = answer
    db.commit()
    return question

def delete_question(db: Session, question_id: uuid.UUID, user_id: uuid.UUID):
    question = get_question_by_id(db, question_id, user_id)
    db.delete(question)
    db.commit()
    return True

def get_questions_by_exam(db: Session, exam_id: uuid.UUID, user_id: uuid.UUID):
    get_exam_by_id(db, exam_id, user_id)
    return db.query(Question).filter(Question.exam_id == exam_id).all()

# EXAM ATTEMPTS
def create_exam_attempt(db: Session, exam_id: uuid.UUID, user_id: uuid.UUID):
    get_exam_by_id(db, exam_id, user_id)
    exam_attempt = ExamAttempt(exam_id=exam_id)
    db.add(exam_attempt)
    db.commit()
    return exam_attempt

def get_exam_attempt_by_id(db: Session, attempt_id: uuid.UUID, user_id: uuid.UUID):
    exam_attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not exam_attempt:
        raise ValueError("Exam attempt not found")
    get_exam_by_id(db, exam_attempt.exam_id, user_id)
    return exam_attempt

def get_exam_attempts(db: Session, exam_id: uuid.UUID, user_id: uuid.UUID):
    get_exam_by_id(db, exam_id, user_id)
    return db.query(ExamAttempt).filter(ExamAttempt.exam_id == exam_id).all()

def score_exam_attempt(db: Session, attempt_id: uuid.UUID, user_id: uuid.UUID):
    exam_attempt = get_exam_attempt_by_id(db, attempt_id, user_id)
    question_attempts = get_question_attempts_by_exam(db, exam_attempt.exam_id, user_id)
    total_scored_questions = 0
    total_score = 0
    for q in question_attempts:
        if q.scored:
            total_scored_questions += 1
            if q.manual_credit or q.is_correct:
                total_score += 1
    exam_attempt.score = total_score
    exam_attempt.scored_questions = total_scored_questions
    db.commit()
    return exam_attempt

def delete_exam_attempt(db: Session, attempt_id: uuid.UUID, user_id: uuid.UUID):
    exam_attempt = get_exam_attempt_by_id(db, attempt_id, user_id)
    db.delete(exam_attempt)
    db.commit()
    return True

# QUESTION ATTEMPTS
def create_question_attempt(db: Session, exam_attempt_id: uuid.UUID, question_id: uuid.UUID, selected_option: str, user_id: uuid.UUID):
    get_exam_attempt_by_id(db, exam_attempt_id, user_id)
    question = get_question_by_id(db, question_id, user_id)
    question_attempt = QuestionAttempt(
        exam_attempt_id=exam_attempt_id,
        question_id=question_id,
        selected_option=selected_option,
        is_correct=(selected_option == question.answer)
    )
    db.add(question_attempt)
    db.commit()
    return question_attempt

def get_question_attempt_by_id(db: Session, question_attempt_id: uuid.UUID, user_id: uuid.UUID):
    question_attempt = db.query(QuestionAttempt).filter(QuestionAttempt.id == question_attempt_id).first()
    if not question_attempt:
        raise ValueError("Question attempt not found")
    get_exam_attempt_by_id(db, question_attempt.exam_attempt_id, user_id)
    get_question_by_id(db, question_attempt.question_id, user_id)
    return question_attempt

def get_question_attempts_by_exam(db: Session, exam_id: uuid.UUID, user_id: uuid.UUID):
    get_exam_by_id(db, exam_id, user_id)
    attempts = (
        db.query(QuestionAttempt)
        .join(ExamAttempt, QuestionAttempt.exam_attempt_id == ExamAttempt.id)
        .filter(ExamAttempt.exam_id == exam_id)
        .all()
    )
    return attempts 

def update_question_attempt_scoring(db: Session, question_attempt_id: uuid.UUID, scored: bool, manual_credit: bool, user_id: uuid.UUID):
    question_attempt = get_question_attempt_by_id(db, question_attempt_id, user_id)
    question_attempt.scored = scored
    question_attempt.manual_credit = manual_credit
    db.commit()
    return question_attempt