import pytest
from app.database.session import SessionLocal, init_db_tables
from app.database.init_db import seed_database
from app.models.db_models import Course, User, Question
from app.agents.assessment_agent import AssessmentGenerationAgent
from app.agents.verification_agent import QuestionVerificationAgent
from app.agents.misconception_agent import MisconceptionAnalysisAgent
from app.agents.learner_agent import LearnerModelAgent
from app.agents.personalization_agent import PersonalizationAgent

@pytest.fixture(scope="module")
def db_session():
    init_db_tables()
    seed_database()
    db = SessionLocal()
    yield db
    db.close()

def test_assessment_generation_and_verification(db_session):
    course = db_session.query(Course).first()
    user = db_session.query(User).first()
    agent = AssessmentGenerationAgent(db_session)

    assessment = agent.generate_assessment(
        course_id=course.id,
        user_id=user.id,
        topic="Searching Algorithms",
        difficulty="Medium",
        num_questions=3
    )

    assert assessment.id is not None
    assert len(assessment.questions) >= 3
    for q in assessment.questions:
        assert q.is_verified is True
        assert len(q.question_text) > 10
        assert q.correct_answer != ""

def test_misconception_analysis_and_learner_mastery(db_session):
    course = db_session.query(Course).first()
    user = db_session.query(User).first()
    
    # Create a mock question
    question = Question(
        assessment_id="test-assess",
        question_text="What is the prerequisite for Binary Search?",
        question_type="mcq",
        correct_answer="The input array must be sorted in ascending or descending order.",
        explanation="Binary search requires sorted input.",
        topic="Searching Algorithms",
        concept="Binary Search",
        difficulty="Medium"
    )

    misc_agent = MisconceptionAnalysisAgent(db_session)
    learner_agent = LearnerModelAgent(db_session)

    # Student provides flawed answer
    student_ans = "The input array must contain strictly positive integers."
    misc_name, misc_topic, feedback = misc_agent.analyze_attempt(
        user_id=user.id,
        course_id=course.id,
        question=question,
        student_answer=student_ans
    )

    assert "Preconditions" in misc_name
    assert "Misconception Diagnosed" in feedback

    # Update mastery on incorrect answer
    prev_mastery = learner_agent.get_or_create_mastery(user.id, course.id, "Searching Algorithms").mastery_score
    new_mastery = learner_agent.update_mastery(user.id, course.id, "Searching Algorithms", is_correct=False)
    assert new_mastery < prev_mastery

    # Update mastery on correct answer
    improved_mastery = learner_agent.update_mastery(user.id, course.id, "Searching Algorithms", is_correct=True)
    assert improved_mastery > new_mastery

def test_personalization_recommendations(db_session):
    course = db_session.query(Course).first()
    user = db_session.query(User).first()
    p_agent = PersonalizationAgent(db_session)

    recs = p_agent.generate_recommendations(user_id=user.id, course_id=course.id)
    assert len(recs) > 0
    first_rec = recs[0]
    assert first_rec.title != ""
    assert "Recommended because" in first_rec.reason
