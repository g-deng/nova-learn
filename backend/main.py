from fastapi import FastAPI
from api.routes import router as api_router
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
app.include_router(api_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
