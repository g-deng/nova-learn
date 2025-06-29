from sqlalchemy.orm import Session
from models import User, StudyStack, Topic, Flashcard, TopicDependency

def get_user_by_id(db: Session, user_id: uuid.UUID):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, firebase_uid: str, name: str):
    user = User(firebase_uid=firebase_uid, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_stacks_by_user_id(db: Session, user_id: uuid.UUID):
    return db.query(StudyStack).filter(StudyStack.user_id == user_id).all()

def create_stack(db: Session, user_id: uuid.UUID, name: str, description: str):
    stack = StudyStack(user_id=user_id, name=name, description=description)
    db.add(stack)
    db.commit()
    db.refresh(stack)
    return stack

def get_topics_by_stack_id(db: Session, stack_id: uuid.UUID):
    return db.query(Topic).filter(Topic.stack_id == stack_id).all()

def create_topic(db: Session, stack_id: uuid.UUID, name: str, description: str):
    topic = Topic(stack_id=stack_id, name=name, description=description)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

def get_flashcards_by_topic_id(db: Session, topic_id: uuid.UUID):
    return db.query(Flashcard).filter(Flashcard.topic_id == topic_id).all()

def create_flashcard(db: Session, topic_id: uuid.UUID, front: str, back: str):
    flashcard = Flashcard(topic_id=topic_id, front=front, back=back)
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)
    return flashcard

def create_flashcards_bulk(db: Session, topic_id: uuid.UUID, fronts: List[str], backs: List[str]):
    if len(fronts) != len(backs) return False

    flashcards = []
    for (front, back) in zip(fronts, backs):
        flashcards.append(Flashcard(topic_id=topic_id, front=front, back=back))
    
    db.add_all(flashcards)
    db.commit()
    return True

def add_flashcard_explanation(db: Session, id: uuid.UUID, explanation: str):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if topic:
        topic.explanation = explanation
        db.commit()
        return True
    else:
        return False

def get_prerequisite_topic_ids(db: Session, topic_id: uuid.UUID):
    dependencies = db.query(TopicDependency).filter(to_topic_id=topic_id).all()
    return [dep.from_topic_id for dep in dependencies]

def get_postrequisite_topic_ids(db: Session, topic_id: uuid.UUID):
    dependencies = db.query(TopicDependency).filter(from_topic_id=topic_id).all()
    return [dep.to_topic_id for dep in dependencies]

def add_topic_dependency(db: session, from_topic_id: uuid.UUID, to_topic_id: uuid.UUID):
    from_topic = db.query(Topic).filter(topic_id=from_topic_id).first()
    to_topic = db.query(Topic).filter(topic_id=to_topic_id).first()
    if from_topic and to_topic:
        topic_dependency = TopicDependency(from_topic_id=from_topic_id, to_topic_id=to_topic_id)
        db.add(topic_dependency)
        db.commit()
        return True
    else:
        return False