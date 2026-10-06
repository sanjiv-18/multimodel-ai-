from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.db_models import LearnerMastery, Misconception, Course, Topic, QuestionAttempt

class LearnerModelAgent:
    """
    AGENT 7: LEARNER MODEL AGENT
    Tracks granular mastery scores for all course topics and concepts.
    Implements a transparent mastery scoring algorithm with difficulty calibration
    and mistake penalties.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_mastery(self, user_id: str, course_id: str, topic_name: str) -> LearnerMastery:
        record = self.db.query(LearnerMastery).filter(
            LearnerMastery.user_id == user_id,
            LearnerMastery.course_id == course_id,
            LearnerMastery.topic.ilike(f"%{topic_name}%")
        ).first()

        if not record:
            record = LearnerMastery(
                user_id=user_id,
                course_id=course_id,
                topic=topic_name,
                concept=topic_name,
                mastery_score=0.50,  # Prior baseline
                total_attempts=0,
                correct_attempts=0,
                last_updated=datetime.utcnow()
            )
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)

        return record

    def update_mastery(
        self,
        user_id: str,
        course_id: str,
        topic: str,
        is_correct: bool,
        difficulty: str = "Medium"
    ) -> float:
        record = self.get_or_create_mastery(user_id, course_id, topic)
        
        diff_weight = 1.0
        if difficulty == "Easy":
            diff_weight = 0.7
        elif difficulty == "Hard":
            diff_weight = 1.4

        current_score = record.mastery_score
        record.total_attempts += 1

        if is_correct:
            record.correct_attempts += 1
            # Dynamic mastery gain proportional to remaining gap
            alpha = 0.20 * diff_weight
            new_score = current_score + alpha * (1.0 - current_score)
        else:
            # Mistake penalty proportional to difficulty
            beta = 0.18 / diff_weight
            new_score = current_score - beta * current_score

        # Bound strictly between [0.05, 0.99]
        clamped_score = max(0.05, min(0.99, new_score))
        record.mastery_score = round(clamped_score, 3)
        record.last_updated = datetime.utcnow()
        self.db.commit()

        return record.mastery_score

    def get_learner_profile(self, user_id: str, course_id: str) -> Dict[str, Any]:
        masteries = self.db.query(LearnerMastery).filter(
            LearnerMastery.user_id == user_id,
            LearnerMastery.course_id == course_id
        ).all()

        # If no masteries exist yet, initialize defaults from course topics
        if not masteries:
            topics = self.db.query(Topic).filter(Topic.course_id == course_id).all()
            for t in topics:
                self.get_or_create_mastery(user_id, course_id, t.name)
            masteries = self.db.query(LearnerMastery).filter(
                LearnerMastery.user_id == user_id,
                LearnerMastery.course_id == course_id
            ).all()

        mastery_items = []
        weak_topics = []
        strong_topics = []
        total_score = 0.0

        for m in masteries:
            total_score += m.mastery_score
            status = "Developing (40-75%)"
            if m.mastery_score < 0.40:
                status = "Weak (<40%)"
                weak_topics.append(m.topic)
            elif m.mastery_score >= 0.75:
                status = "Mastered (>75%)"
                strong_topics.append(m.topic)

            mastery_items.append({
                "topic": m.topic,
                "concept": m.concept,
                "mastery_score": m.mastery_score,
                "total_attempts": m.total_attempts,
                "correct_attempts": m.correct_attempts,
                "status": status,
                "last_updated": m.last_updated
            })

        avg_mastery = round(total_score / len(masteries), 3) if masteries else 0.50

        # Fetch active misconceptions
        active_misconceptions = self.db.query(Misconception).filter(
            Misconception.user_id == user_id,
            Misconception.course_id == course_id,
            Misconception.resolved == False
        ).all()

        recent_attempts_count = self.db.query(QuestionAttempt).filter(
            QuestionAttempt.user_id == user_id
        ).count()

        return {
            "overall_mastery": avg_mastery,
            "topics_mastery": mastery_items,
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
            "active_misconceptions": active_misconceptions,
            "recent_activity_count": recent_attempts_count
        }
