import uuid
from datetime import datetime, timezone, timedelta
from typing import List
from sqlalchemy.orm import Session
from db.models import FlashcardReview, FlashcardStats

# SM-2 algorithm constants
MIN_EASE = 1.3
MAX_EASE = 2.5
DEFAULT_EASE = 2.5

def update_flashcard_stats_from_reviews(db: Session, flashcard_id: uuid.UUID):
    reviews = db.query(FlashcardReview).filter(FlashcardReview.flashcard_id == flashcard_id).order_by(FlashcardReview.timestamp.asc()).all()
    if not reviews:
        # If no reviews, delete stats if exists
        stats = db.query(FlashcardStats).filter(FlashcardStats.flashcard_id == flashcard_id).first()
        if stats:
            db.delete(stats)
            db.commit()
        return None

    correct_count = sum(1 for r in reviews if r.grade >= 4)
    wrong_count = sum(1 for r in reviews if r.grade < 4)
    last_seen = reviews[-1].timestamp

    # SM-2 algorithm https://en.wikipedia.org/wiki/SuperMemo
    ease = DEFAULT_EASE
    interval = 1
    due_date = (last_seen.date() + timedelta(days=interval))
    for idx, r in enumerate(reviews):
        q = r.grade
        if idx == 0:
            interval = 1
        else:
            if q < 3:
                interval = 1
            else:
                interval = int(interval * ease)
        ease = max(MIN_EASE, min(MAX_EASE, ease + (0.1 - (5-q)*(0.08+(5-q)*0.02))))
        due_date = r.timestamp.date() + timedelta(days=interval)

    due_date = datetime.combine(due_date, datetime.min.time(), tzinfo=timezone.utc)

    stats = db.query(FlashcardStats).filter(FlashcardStats.flashcard_id == flashcard_id).first()
    if not stats:
        stats = FlashcardStats(
            flashcard_id=flashcard_id,
            correct_count=correct_count,
            wrong_count=wrong_count,
            last_seen=last_seen,
            ease=ease,
            interval_days=interval,
            due_date=due_date
        )
        db.add(stats)
    else:
        stats.correct_count = correct_count
        stats.wrong_count = wrong_count
        stats.last_seen = last_seen
        stats.ease = ease
        stats.interval_days = interval
        stats.due_date = due_date
    db.commit()
    db.refresh(stats)
    return stats


def update_ewma_miss(db: Session, flashcard_id: uuid.UUID, is_miss: bool, alpha: float = 0.2):
    print("looking at ewma for ", flashcard_id)
    stats = db.query(FlashcardStats).filter(FlashcardStats.flashcard_id == flashcard_id).first()
    if not stats:
        stats = FlashcardStats(flashcard_id=flashcard_id, ewma_miss=1.0 if is_miss else 0.0)
        db.add(stats)
        db.commit()
        db.refresh(stats)
        print("updated ewma_miss ", stats.ewma_miss)
        return stats
    
    attempts = db.query(FlashcardReview).filter(FlashcardReview.flashcard_id == flashcard_id).count()
    if stats.correct_count + stats.wrong_count >= attempts:
        return stats
    
    old_ewma = stats.ewma_miss
    print(stats.wrong_count, stats.correct_count, attempts)
    if old_ewma is None:
        print("no old")
        new_ewma = 1.0 if is_miss else 0.0
        stats.ewma_miss = new_ewma
    else:
        print("existing old", old_ewma)
        new_ewma = alpha * (1 if is_miss else 0) + (1 - alpha) * old_ewma
        stats.ewma_miss = new_ewma
    db.commit()
    db.refresh(stats)
    print("updated ewma_miss ", stats.ewma_miss)
    return stats