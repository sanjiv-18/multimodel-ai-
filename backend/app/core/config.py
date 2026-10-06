import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "LearnFlow AI — Adaptive Multi-Agent Tutor"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./learnflow.db")
    
    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "learnflow-hackathon-2026-super-secret-key-321")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "fallback")  # "fallback", "ollama", "openai", "gemini"
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama3:latest")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Embeddings
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "tfidf_cosine")  # "tfidf_cosine", "openai", "ollama"
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    
    # Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
