import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.session import init_db_tables
from app.database.init_db import seed_database
from app.api import auth, courses, materials, knowledge, tutor, assessments, learner, evaluation

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="LearnFlow AI — Adaptive Multi-Agent Tutor Backend API"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory for source viewing
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(materials.router, prefix="/api")
app.include_router(knowledge.router, prefix="/api")
app.include_router(tutor.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(learner.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    init_db_tables()
    seed_database()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "embedding_provider": settings.EMBEDDING_PROVIDER
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
