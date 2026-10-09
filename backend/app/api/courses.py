from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.db_models import Course, Material, Topic, LearnerMastery, User, QuestionAttempt
from app.schemas.pydantic_schemas import CourseCreate, CourseOut
from app.api.auth import get_current_user

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.post("", response_model=CourseOut)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = Course(
        title=course_in.title.strip(),
        description=course_in.description.strip() if course_in.description else None,
        code=course_in.code.strip() if course_in.code else None,
        user_id=current_user.id
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    
    return CourseOut(
        id=course.id,
        title=course.title,
        description=course.description,
        code=course.code,
        created_at=course.created_at,
        materials_count=0,
        topics_count=0,
        mastery_avg=0.0
    )

@router.get("", response_model=List[CourseOut])
def list_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Isolate courses belonging to the authenticated user
    courses = db.query(Course).filter(
        (Course.user_id == current_user.id) | (Course.user_id == None)
    ).order_by(Course.created_at.desc()).all()
    
    results = []
    for c in courses:
        mat_count = db.query(Material).filter(Material.course_id == c.id).count()
        top_count = db.query(Topic).filter(Topic.course_id == c.id).count()
        
        # Check if student has actual question attempts for this course
        has_attempts = db.query(QuestionAttempt).filter(
            QuestionAttempt.user_id == current_user.id
        ).count() > 0

        # Compute mastery average for current user based strictly on real records
        mastery_avg_val = db.query(func.avg(LearnerMastery.mastery_score)).filter(
            LearnerMastery.course_id == c.id,
            LearnerMastery.user_id == current_user.id,
            LearnerMastery.total_attempts > 0
        ).scalar()
        
        computed_mastery = round(float(mastery_avg_val), 2) if (mastery_avg_val is not None) else 0.0
        
        results.append(CourseOut(
            id=c.id,
            title=c.title,
            description=c.description,
            code=c.code,
            created_at=c.created_at,
            materials_count=mat_count,
            topics_count=top_count,
            mastery_avg=computed_mastery
        ))
        
    return results

@router.get("/{course_id}", response_model=CourseOut)
def get_course_detail(course_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    mat_count = db.query(Material).filter(Material.course_id == course.id).count()
    top_count = db.query(Topic).filter(Topic.course_id == course.id).count()
    
    mastery_avg_val = db.query(func.avg(LearnerMastery.mastery_score)).filter(
        LearnerMastery.course_id == course.id,
        LearnerMastery.user_id == current_user.id,
        LearnerMastery.total_attempts > 0
    ).scalar()
    
    computed_mastery = round(float(mastery_avg_val), 2) if (mastery_avg_val is not None) else 0.0
    
    return CourseOut(
        id=course.id,
        title=course.title,
        description=course.description,
        code=course.code,
        created_at=course.created_at,
        materials_count=mat_count,
        topics_count=top_count,
        mastery_avg=computed_mastery
    )
