from fastapi import FastAPI
from api.routes.flashcard_routes import router as flashcard_router
from api.routes.stack_routes import router as stack_router
from api.routes.exam_routes import router as exam_router
from db.database import engine
from db.models import Base
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # TODO: Update with frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
app.include_router(stack_router)
app.include_router(flashcard_router)
app.include_router(exam_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
