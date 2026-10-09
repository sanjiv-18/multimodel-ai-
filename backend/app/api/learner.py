from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.db_models import LearnerMastery, Misconception, Recommendation, Course, User
from app.schemas.pydantic_schemas import (
    LearnerMasteryOut, MisconceptionOut, RecommendationOut, LearnerOverviewOut
)
from app.agents.learner_agent import LearnerModelAgent
from app.agents.personalization_agent import PersonalizationAgent
from app.api.auth import get_current_user

router = APIRouter(prefix="/students/me", tags=["Learner Modeling & Analytics"])

@router.get("/mastery", response_model=List[LearnerMasteryOut])
def get_student_mastery(
    course_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LearnerMastery).filter(LearnerMastery.user_id == current_user.id)
    if course_id:
        query = query.filter(LearnerMastery.course_id == course_id)
        
    records = query.all()
    results = []
    for r in records:
        status_lbl = "Not started"
        if r.total_attempts > 0:
            if r.mastery_score < 0.40:
                status_lbl = "Weak (<40%)"
            elif r.mastery_score >= 0.75:
                status_lbl = "Mastered (>75%)"
            else:
                status_lbl = "Developing (40-75%)"

        results.append(LearnerMasteryOut(
            topic=r.topic,
            concept=r.concept,
            mastery_score=r.mastery_score if r.total_attempts > 0 else 0.0,
            total_attempts=r.total_attempts,
            correct_attempts=r.correct_attempts,
            status=status_lbl,
            last_updated=r.last_updated
        ))
    return results

@router.get("/misconceptions", response_model=List[MisconceptionOut])
def get_student_misconceptions(
    course_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Misconception).filter(Misconception.user_id == current_user.id)
    if course_id:
        query = query.filter(Misconception.course_id == course_id)
        
    records = query.order_by(Misconception.last_detected_at.desc()).all()
    results = []
    for r in records:
        results.append(MisconceptionOut(
            id=r.id,
            topic=r.topic,
            concept=r.concept,
            misconception_name=r.misconception_name,
            description=r.description,
            count=r.count,
            resolved=r.resolved,
            last_detected_at=r.last_detected_at
        ))
    return results

@router.get("/recommendations", response_model=List[RecommendationOut])
def get_student_recommendations(
    course_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If course_id provided, ensure fresh recommendations
    if course_id:
        p_agent = PersonalizationAgent(db)
        p_agent.generate_recommendations(current_user.id, course_id)

    query = db.query(Recommendation).filter(Recommendation.user_id == current_user.id)
    if course_id:
        query = query.filter(Recommendation.course_id == course_id)
        
    records = query.order_by(Recommendation.priority.asc()).all()
    results = []
    for r in records:
        results.append(RecommendationOut(
            id=r.id,
            title=r.title,
            description=r.description,
            reason=r.reason,
            action_type=r.action_type,
            target_topic=r.target_topic,
            target_resource=r.target_resource,
            priority=r.priority,
            is_completed=r.is_completed,
            created_at=r.created_at
        ))
    return results

@router.get("/overview", response_model=LearnerOverviewOut)
def get_learner_overview(
    course_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_course_id = course_id
    if not target_course_id:
        user_first_course = db.query(Course).filter(
            (Course.user_id == current_user.id) | (Course.user_id == None)
        ).first()
        target_course_id = user_first_course.id if user_first_course else None

    if not target_course_id:
        # Honest empty state for user with no courses
        return LearnerOverviewOut(
            overall_mastery=0.0,
            topics_mastery=[],
            weak_topics=[],
            strong_topics=[],
            active_misconceptions=[],
            recommendations=[],
            recent_activity_count=0
        )

    agent = LearnerModelAgent(db)
    profile = agent.get_learner_profile(current_user.id, target_course_id)

    # Get recommendations
    recs = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.id,
        Recommendation.course_id == target_course_id
    ).order_by(Recommendation.priority.asc()).all()

    if not recs:
        p_agent = PersonalizationAgent(db)
        recs = p_agent.generate_recommendations(current_user.id, target_course_id)

    rec_outs = [
        RecommendationOut(
            id=r.id,
            title=r.title,
            description=r.description,
            reason=r.reason,
            action_type=r.action_type,
            target_topic=r.target_topic,
            target_resource=r.target_resource,
            priority=r.priority,
            is_completed=r.is_completed,
            created_at=r.created_at
        )
        for r in recs
    ]

    misc_outs = [
        MisconceptionOut(
            id=m.id,
            topic=m.topic,
            concept=m.concept,
            misconception_name=m.misconception_name,
            description=m.description,
            count=m.count,
            resolved=m.resolved,
            last_detected_at=m.last_detected_at
        )
        for m in profile["active_misconceptions"]
    ]

    return LearnerOverviewOut(
        overall_mastery=profile["overall_mastery"],
        topics_mastery=[LearnerMasteryOut(**t) for t in profile["topics_mastery"]],
        weak_topics=profile["weak_topics"],
        strong_topics=profile["strong_topics"],
        active_misconceptions=misc_outs,
        recommendations=rec_outs,
        recent_activity_count=profile["recent_activity_count"]
    )
