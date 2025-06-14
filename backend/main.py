from fastapi import FastAPI
from api.routes import router as api_router
from db.database import engine
from db.models import Base

app = FastAPI()

Base.metadata.create_all(bind=engine)
app.include_router(api_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
