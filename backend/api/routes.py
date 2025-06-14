from fastapi import APIRouter

router = APIRouter(prefix="/api")

@router.get("/flashcards")
def get_flashcards():
    return [{"front": "What is AI?", "back": "Artificial Intelligence"}]
