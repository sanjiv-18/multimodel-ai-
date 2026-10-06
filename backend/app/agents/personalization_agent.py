from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.db_models import Recommendation, LearnerMastery, Misconception

class PersonalizationAgent:
    """
    AGENT 8: PERSONALIZATION AGENT
    Synthesizes learner mastery scores and detected misconceptions into actionable,
    grounded Next Best Actions with pedagogical justifications.
    """
    def __init__(self, db: Session):
        self.db = db

    def generate_recommendations(self, user_id: str, course_id: str) -> List[Recommendation]:
        # Delete prior stale recommendations
        self.db.query(Recommendation).filter(
            Recommendation.user_id == user_id,
            Recommendation.course_id == course_id
        ).delete()

        masteries = self.db.query(LearnerMastery).filter(
            LearnerMastery.user_id == user_id,
            LearnerMastery.course_id == course_id
        ).all()

        misconceptions = self.db.query(Misconception).filter(
            Misconception.user_id == user_id,
            Misconception.course_id == course_id,
            Misconception.resolved == False
        ).all()

        recs = []

        # 1. High priority: Remediate detected misconceptions
        for misc in misconceptions:
            rec = Recommendation(
                user_id=user_id,
                course_id=course_id,
                title=f"Resolve Misconception in {misc.topic}",
                description=f"Review the concept '{misc.concept or misc.topic}' to clear the flaw: {misc.misconception_name}.",
                reason=f"Recommended because you exhibited a conceptual gap during recent assessments on '{misc.misconception_name}'.",
                action_type="review_concept",
                target_topic=misc.topic,
                target_resource="Algorithms_Textbook.pdf — Page 42",
                priority=1
            )
            self.db.add(rec)
            recs.append(rec)

        # 2. Topic Mastery-based recommendations
        for m in masteries:
            pct = int(m.mastery_score * 100)
            if m.mastery_score < 0.40:
                rec = Recommendation(
                    user_id=user_id,
                    course_id=course_id,
                    title=f"Strengthen Foundations in {m.topic}",
                    description=f"Watch lecture section on {m.topic} and solve 3 foundational practice questions.",
                    reason=f"Recommended because your current mastery in {m.topic} is {pct}% (below the 40% proficiency threshold) across {m.total_attempts} attempts.",
                    action_type="watch_video",
                    target_topic=m.topic,
                    target_resource="Lecture_03_Searching.mp4 — Timestamp 14:22",
                    priority=1
                )
                self.db.add(rec)
                recs.append(rec)
            elif 0.40 <= m.mastery_score < 0.75:
                rec = Recommendation(
                    user_id=user_id,
                    course_id=course_id,
                    title=f"Practice Medium-Level Challenges in {m.topic}",
                    description=f"Take an adaptive assessment targeting intermediate problem-solving in {m.topic}.",
                    reason=f"Recommended because your mastery is developing at {pct}%. A 4-question adaptive quiz will reinforce your intuition.",
                    action_type="practice_easy",
                    target_topic=m.topic,
                    target_resource="LectureSlides_Algorithms.pptx — Slide 27",
                    priority=2
                )
                self.db.add(rec)
                recs.append(rec)
            else:
                rec = Recommendation(
                    user_id=user_id,
                    course_id=course_id,
                    title=f"Advance to Next Concept or Hard Quiz in {m.topic}",
                    description=f"You have demonstrated strong proficiency ({pct}%). Tackle advanced variations or progress to next dependent topics.",
                    reason=f"Recommended because you achieved {pct}% mastery with {m.correct_attempts}/{m.total_attempts} correct answers.",
                    action_type="challenge_quiz",
                    target_topic=m.topic,
                    target_resource="Algorithms_Textbook.pdf — Page 112",
                    priority=3
                )
                self.db.add(rec)
                recs.append(rec)

        # If empty (brand new student), seed initial diagnostic recommendation
        if not recs:
            rec = Recommendation(
                user_id=user_id,
                course_id=course_id,
                title="Complete Diagnostic Assessment",
                description="Take a quick 4-question diagnostic quiz in Searching Algorithms to calibrate your baseline learner model.",
                reason="Recommended for new students to evaluate prior knowledge and personalize your course pathway.",
                action_type="practice_easy",
                target_topic="Searching Algorithms",
                target_resource="Algorithms_Textbook.pdf — Page 42",
                priority=1
            )
            self.db.add(rec)
            recs.append(rec)

        self.db.commit()
        return recs
