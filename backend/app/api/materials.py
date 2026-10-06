import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.db_models import Material, Course, DocumentChunk, User
from app.schemas.pydantic_schemas import MaterialOut
from app.agents.ingestion_agent import MultimodalIngestionAgent
from app.core.config import settings
from app.api.auth import get_current_user

router = APIRouter(tags=["Materials"])

def process_material_background(material_id: str):
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        agent = MultimodalIngestionAgent(db)
        agent.process_material(material_id)
    finally:
        db.close()

@router.post("/courses/{course_id}/materials", response_model=MaterialOut)
async def upload_material(
    course_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    filename = file.filename or "uploaded_file"
    file_title = title if title else filename
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"

    file_type = "pdf"
    if ext in ["ppt", "pptx"]:
        file_type = "pptx"
    elif ext in ["mp4", "mkv", "avi", "mov", "mp3", "wav"]:
        file_type = "video"

    # Save to disk
    save_path = os.path.join(settings.UPLOAD_DIR, f"{course_id}_{filename}")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)

    material = Material(
        course_id=course_id,
        title=file_title,
        file_type=file_type,
        file_path=save_path,
        file_size_bytes=file_size,
        status="processing"
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # Process ingestion synchronously
    ingestion_agent = MultimodalIngestionAgent(db)
    ingestion_agent.process_material(material.id)
    
    # Trigger Agent 2 (Knowledge Org) to extract new topics & concepts from notes
    from app.agents.knowledge_agent import KnowledgeOrganizationAgent
    from app.agents.personalization_agent import PersonalizationAgent
    k_agent = KnowledgeOrganizationAgent(db)
    k_agent.organize_course_knowledge(course_id)

    # Trigger Agent 8 (Personalization) to create baseline recommendations
    p_agent = PersonalizationAgent(db)
    p_agent.generate_recommendations(current_user.id, course_id)

    db.refresh(material)

    chunk_count = db.query(DocumentChunk).filter(DocumentChunk.material_id == material.id).count()

    return MaterialOut(
        id=material.id,
        course_id=material.course_id,
        title=material.title,
        file_type=material.file_type,
        file_path=material.file_path,
        file_size_bytes=material.file_size_bytes,
        status=material.status,
        error_message=material.error_message,
        created_at=material.created_at,
        chunks_count=chunk_count
    )

@router.get("/courses/{course_id}/materials", response_model=List[MaterialOut])
def list_course_materials(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    materials = db.query(Material).filter(Material.course_id == course_id).all()
    results = []
    for m in materials:
        chunk_count = db.query(DocumentChunk).filter(DocumentChunk.material_id == m.id).count()
        results.append(MaterialOut(
            id=m.id,
            course_id=m.course_id,
            title=m.title,
            file_type=m.file_type,
            file_path=m.file_path,
            file_size_bytes=m.file_size_bytes,
            status=m.status,
            error_message=m.error_message,
            created_at=m.created_at,
            chunks_count=chunk_count
        ))
    return results

@router.get("/materials/{material_id}/status")
def get_material_status(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    chunk_count = db.query(DocumentChunk).filter(DocumentChunk.material_id == material.id).count()
    return {
        "id": material.id,
        "title": material.title,
        "status": material.status,
        "file_type": material.file_type,
        "chunks_count": chunk_count,
        "error_message": material.error_message
    }
