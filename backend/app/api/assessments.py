import json
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.db_models import Assessment, Question, QuestionAttempt, Course, User
from app.schemas.pydantic_schemas import (
    AssessmentGenerateRequest, AssessmentOut, QuestionOut,
    AssessmentSubmitRequest, AssessmentResultOut, QuestionResultOut
)
from app.agents.assessment_agent import AssessmentGenerationAgent
from app.agents.misconception_agent import MisconceptionAnalysisAgent
from app.agents.learner_agent import LearnerModelAgent
from app.agents.personalization_agent import PersonalizationAgent
from app.api.auth import get_current_user

router = APIRouter(tags=["Assessments"])

@router.post("/courses/{course_id}/assessments/generate", response_model=AssessmentOut)
def generate_course_assessment(
    course_id: str,
    req: AssessmentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    if course.user_id and course.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Cannot generate assessment for another student's course.")

    agent = AssessmentGenerationAgent(db)

    assessment = agent.generate_assessment(
        course_id=course_id,
        user_id=current_user.id,
        topic=req.topic,
        difficulty=req.difficulty,
        num_questions=req.num_questions or 4,
        adaptive_mode=req.adaptive_mode if req.adaptive_mode is not None else True
    )

    questions_out = []
    for q in assessment.questions:
        opts = json.loads(q.options_json) if q.options_json else []
        questions_out.append(QuestionOut(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=opts,
            difficulty=q.difficulty,
            topic=q.topic,
            concept=q.concept,
            source_reference=q.source_reference,
            is_verified=q.is_verified
        ))

    return AssessmentOut(
        id=assessment.id,
        course_id=assessment.course_id,
        topic=assessment.topic,
        difficulty=assessment.difficulty,
        total_questions=len(questions_out),
        questions=questions_out,
        created_at=assessment.created_at
    )

@router.get("/assessments/{assessment_id}", response_model=AssessmentOut)
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    questions_out = []
    for q in assessment.questions:
        opts = json.loads(q.options_json) if q.options_json else []
        questions_out.append(QuestionOut(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=opts,
            difficulty=q.difficulty,
            topic=q.topic,
            concept=q.concept,
            source_reference=q.source_reference,
            is_verified=q.is_verified
        ))

    return AssessmentOut(
        id=assessment.id,
        course_id=assessment.course_id,
        topic=assessment.topic,
        difficulty=assessment.difficulty,
        total_questions=len(questions_out),
        questions=questions_out,
        created_at=assessment.created_at
    )

@router.post("/assessments/{assessment_id}/submit", response_model=AssessmentResultOut)
def submit_assessment_answers(
    assessment_id: str,
    submit_req: AssessmentSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot submit an assessment belonging to another user")

    # Prevent duplicate submission
    prior_attempts = db.query(QuestionAttempt).filter(
        QuestionAttempt.assessment_id == assessment_id,
        QuestionAttempt.user_id == current_user.id
    ).count()
    if prior_attempts > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This assessment has already been submitted and graded.")

    misconception_agent = MisconceptionAnalysisAgent(db)
    learner_agent = LearnerModelAgent(db)
    personalization_agent = PersonalizationAgent(db)


    results = []
    correct_count = 0
    updated_mastery_map: Dict[str, float] = {}

    for sub in submit_req.submissions:
        question = db.query(Question).filter(Question.id == sub.question_id).first()
        if not question:
            continue

        student_ans = sub.student_answer.strip()
        correct_ans = question.correct_answer.strip()
        
        # Check correctness
        is_correct = (student_ans.lower() == correct_ans.lower())
        score = 1.0 if is_correct else 0.0
        if is_correct:
            correct_count += 1

        # Misconception analysis
        misc_detected = None
        misc_feedback = None
        if not is_correct:
            m_name, m_topic, m_feed = misconception_agent.analyze_attempt(
                user_id=current_user.id,
                course_id=assessment.course_id,
                question=question,
                student_answer=student_ans
            )
            misc_detected = m_name
            misc_feedback = m_feed

        # Save Attempt Record
        attempt = QuestionAttempt(
            user_id=current_user.id,
            assessment_id=assessment.id,
            question_id=question.id,
            student_answer=student_ans,
            is_correct=is_correct,
            score=score,
            misconception_detected=misc_detected,
            misconception_topic=question.topic,
            misconception_feedback=misc_feedback
        )
        db.add(attempt)

        # Update Learner Mastery
        new_mastery = learner_agent.update_mastery(
            user_id=current_user.id,
            course_id=assessment.course_id,
            topic=question.topic,
            is_correct=is_correct,
            difficulty=question.difficulty
        )
        updated_mastery_map[question.topic] = new_mastery

        results.append(QuestionResultOut(
            question_id=question.id,
            question_text=question.question_text,
            student_answer=student_ans,
            correct_answer=correct_ans,
            is_correct=is_correct,
            score=score,
            explanation=question.explanation,
            source_reference=question.source_reference,
            misconception_detected=misc_detected,
            misconception_feedback=misc_feedback
        ))

    db.commit()

    # Trigger Personalization Agent Next Best Actions
    new_recs = personalization_agent.generate_recommendations(
        user_id=current_user.id,
        course_id=assessment.course_id
    )
    rec_titles = [r.title for r in new_recs]

    total_q = len(submit_req.submissions)
    pct = round((correct_count / total_q) * 100, 1) if total_q > 0 else 0.0

    return AssessmentResultOut(
        assessment_id=assessment.id,
        total_questions=total_q,
        correct_count=correct_count,
        score_percentage=pct,
        results=results,
        updated_mastery=updated_mastery_map,
        new_recommendations=rec_titles
    )
