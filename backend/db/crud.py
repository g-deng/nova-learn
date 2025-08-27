import uuid
from typing import List
from sqlalchemy.orm import Session
from db.models import Exam, Question, User, StudyStack, Topic, Flashcard, TopicDependency

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

def get_topics_by_stack_id(db: Session, stack_id: uuid.UUID, user_id: uuid.UUID):
    stack = db.query(StudyStack).filter(StudyStack.id == stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Stack not found or does not belong to user")
    return db.query(Topic).filter(Topic.stack_id == stack_id).all()

def create_topic(db: Session, stack_id: uuid.UUID, name: str, description: str, user_id: uuid.UUID):
    stack = db.query(StudyStack).filter(StudyStack.id == stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Stack not found or does not belong to user")
    topic = Topic(stack_id=stack_id, name=name, description=description)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

def get_topic_by_id(db: Session, topic_id: uuid.UUID, user_id: uuid.UUID):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    stack = db.query(StudyStack).filter(StudyStack.id == topic.stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Topic does not belong to user")
    return topic

def update_topic(db: Session, topic_id: uuid.UUID, name: str, description: str, stack_id: uuid.UUID, user_id: uuid.UUID):
    if db.query(StudyStack).filter(StudyStack.id == stack_id, StudyStack.user_id == user_id).first() is None:
        raise ValueError
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.stack_id == stack_id).first()
    if not topic:
        raise ValueError("Topic not found or does not belong to user")
    if name != topic.name:
        topic.name = name
    if description != topic.description:
        topic.description = description
    db.commit()
    db.refresh(topic)
    return topic

def delete_topic(db: Session, topic_id: uuid.UUID, stack_id: uuid.UUID, user_id: uuid.UUID):
    if db.query(StudyStack).filter(StudyStack.id == stack_id, StudyStack.user_id == user_id).first() is None:
        raise ValueError
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.stack_id == stack_id).first()
    if not topic:
        raise ValueError("Topic not found or does not belong to user")
    db.delete(topic)
    db.commit()
    return True

def get_flashcards_by_stack_id(db: Session, stack_id: uuid.UUID, user_id: uuid.UUID):
    stack = db.query(StudyStack).filter(StudyStack.id == stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Stack not found or does not belong to user")
    return db.query(Flashcard).join(Topic).filter(Topic.stack_id == stack_id).all()

def get_flashcards_by_topic_id(db: Session, topic_id: uuid.UUID, user_id: uuid.UUID):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    stack = db.query(StudyStack).filter(StudyStack.id == topic.stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Topic does not belong to user")
    return db.query(Flashcard).filter(Flashcard.topic_id == topic_id).all()

def create_flashcard(db: Session, topic_id: uuid.UUID, front: str, back: str, user_id: uuid.UUID):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    stack = db.query(StudyStack).filter(StudyStack.id == topic.stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Topic does not belong to user")
    flashcard = Flashcard(topic_id=topic_id, front=front, back=back)
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)
    return flashcard

def create_flashcards_bulk(db: Session, topic_id: uuid.UUID, fronts: list[str], backs: List[str], user_id: uuid.UUID):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    stack = db.query(StudyStack).filter(StudyStack.id == topic.stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Topic does not belong to user")
    
    if len(fronts) != len(backs): return False
    flashcards = []
    for (front, back) in zip(fronts, backs):
        flashcards.append(Flashcard(topic_id=topic_id, front=front, back=back))
    
    db.add_all(flashcards)
    db.commit()
    return True

def edit_flashcard(db: Session, id: uuid.UUID, front: str, back: str, user_id: uuid.UUID):
    flashcard = db.query(Flashcard).filter(Flashcard.id == id).first()
    if not flashcard:
        raise ValueError("Flashcard not found")
    topic = db.query(Topic).filter(Topic.id == flashcard.topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    stack = db.query(StudyStack).filter(StudyStack.id == topic.stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Flashcard does not belong to user")
    
    if front != flashcard.front:
        flashcard.front = front
    if back != flashcard.back:
        flashcard.back = back
    db.commit()
    db.refresh(flashcard)
    return flashcard

def delete_flashcard(db: Session, id: uuid.UUID, user_id: uuid.UUID):
    flashcard = db.query(Flashcard).filter(Flashcard.id == id).first()
    if not flashcard:
        raise ValueError("Flashcard not found")
    topic = db.query(Topic).filter(Topic.id == flashcard.topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    stack = db.query(StudyStack).filter(StudyStack.id == topic.stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Flashcard does not belong to user")
    
    db.delete(flashcard)
    db.commit()
    return True

def add_flashcard_explanation(db: Session, id: uuid.UUID, explanation: str, user_id: uuid.UUID):
    flashcard = db.query(Flashcard).filter(Flashcard.id == id).first()
    if not flashcard:
        raise ValueError("Flashcard not found")
    topic = db.query(Topic).filter(Topic.id == flashcard.topic_id).first()
    if not topic:
        raise ValueError("Topic not found")
    stack = db.query(StudyStack).filter(StudyStack.id == topic.stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Flashcard does not belong to user")
    
    if flashcard:
        flashcard.explanation = explanation
        db.commit()
        db.refresh(flashcard)
        return flashcard
    else:
        raise ValueError("Flashcard not found or does not belong to user")
    

def get_topic_dependencies_by_stack_id(db: Session, stack_id: uuid.UUID, user_id: uuid.UUID):
    stack = db.query(StudyStack).filter(StudyStack.id == stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Stack not found or does not belong to user")
    return db.query(TopicDependency).filter(
        (TopicDependency.from_topic.has(stack_id=stack_id)) | 
        (TopicDependency.to_topic.has(stack_id=stack_id))
    ).all()

def get_prerequisite_topic_ids(db: Session, topic_id: uuid.UUID, user_id: uuid.UUID):
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.stack.user_id == user_id).first()
    if not topic:
        raise ValueError("Topic not found or does not belong to user")
    dependencies = db.query(TopicDependency).filter(TopicDependency.to_topic_id == topic_id).all()
    return [dep.from_topic_id for dep in dependencies]

def get_postrequisite_topic_ids(db: Session, topic_id: uuid.UUID, user_id: uuid.UUID):
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.stack.user_id == user_id).first()
    if not topic:
        raise ValueError("Topic not found or does not belong to user")
    dependencies = db.query(TopicDependency).filter(TopicDependency.from_topic_id == topic_id).all()
    return [dep.to_topic_id for dep in dependencies]

def add_topic_dependency(db: Session, from_topic_id: uuid.UUID, to_topic_id: uuid.UUID, user_id: uuid.UUID):
    from_topic = db.query(Topic).filter(Topic.id == from_topic_id, Topic.stack.user_id == user_id).first()
    to_topic = db.query(Topic).filter(Topic.id == to_topic_id, Topic.stack.user_id == user_id).first()

    if not from_topic or not to_topic:
        raise ValueError("Topic not found or does not belong to user")
    
    if from_topic and to_topic:
        topic_dependency = TopicDependency(from_topic_id=from_topic_id, to_topic_id=to_topic_id)
        db.add(topic_dependency)
        db.commit()
        return True
    else:
        return False
    

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

def create_exam(db: Session, stack_id: uuid.UUID, name: str, user_id: uuid.UUID):
    stack = db.query(StudyStack).filter(StudyStack.id == stack_id, StudyStack.user_id == user_id).first()
    if not stack:
        raise ValueError("Study stack not found or does not belong to user")

    exam = Exam(stack_id=stack_id, name=name)
    db.add(exam)
    db.commit()
    return exam

def get_exam(db: Session, exam_id: uuid.UUID, user_id: uuid.UUID):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.stack.user_id == user_id).first()
    if not exam:
        raise ValueError("Exam not found or does not belong to user")
    return exam

def delete_exam(db: Session, exam_id: uuid.UUID, user_id: uuid.UUID):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.stack.user_id == user_id).first()
    if not exam:
        raise ValueError("Exam not found or does not belong to user")

    db.delete(exam)
    db.commit()
    return True

def create_question(db: Session, exam_id: uuid.UUID, text: str, options: list[str], answer: str, user_id: uuid.UUID):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.stack.user_id == user_id).first()
    if not exam:
        raise ValueError("Exam not found or does not belong to user")

    if answer not in ['A', 'B', 'C', 'D']:
        raise ValueError("Invalid answer option")

    question = Question(
        exam_id=exam_id,
        text=text,
        option_a=options[0],
        option_b=options[1],
        option_c=options[2],
        option_d=options[3],
        answer=answer
    )
    db.add(question)
    db.commit()
    return question

def update_question(db: Session, question_id: uuid.UUID, text: str, options: list[str], answer: str, user_id: uuid.UUID):
    question = db.query(Question).filter(Question.id == question_id, Question.exam.stack.user_id == user_id).first()
    if not question:
        raise ValueError("Question not found or does not belong to user")

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
    question = db.query(Question).filter(Question.id == question_id, Question.exam.stack.user_id == user_id).first()
    if not question:
        raise ValueError("Question not found or does not belong to user")

    db.delete(question)
    db.commit()
    return True

def get_questions_by_exam(db: Session, exam_id: uuid.UUID, user_id: uuid.UUID):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.stack.user_id == user_id).first()
    if not exam:
        raise ValueError("Exam not found or does not belong to user")

    return db.query(Question).filter(Question.exam_id == exam_id).all()