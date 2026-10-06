from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.db_models import Course, User
from app.schemas.pydantic_schemas import EvaluationRunOut
from app.evaluation.metrics_runner import EvaluationRunner
from app.api.auth import get_current_user

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Benchmarking"])

@router.post("/run", response_model=EvaluationRunOut)
async def run_evaluation_suite(
    course_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_course = None
    if course_id:
        target_course = db.query(Course).filter(Course.id == course_id).first()
    else:
        target_course = db.query(Course).first()

    if not target_course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No course available for evaluation")

    results = await EvaluationRunner.run_benchmark_suite(
        db=db,
        course_id=target_course.id,
        user_id=current_user.id
    )
    return results

@router.get("/results", response_model=EvaluationRunOut)
async def get_latest_evaluation_results(
    course_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_course = None
    if course_id:
        target_course = db.query(Course).filter(Course.id == course_id).first()
    else:
        target_course = db.query(Course).first()

    if not target_course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No course available for evaluation")

    # Run quick benchmark evaluation
    results = await EvaluationRunner.run_benchmark_suite(
        db=db,
        course_id=target_course.id,
        user_id=current_user.id
    )
    return results
