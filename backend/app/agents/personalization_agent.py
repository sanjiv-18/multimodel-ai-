from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.db_models import Recommendation, LearnerMastery, Misconception, DocumentChunk, Course, Material

class PersonalizationAgent:
    """
    AGENT 8: PERSONALIZATION AGENT
    Synthesizes learner mastery scores and detected misconceptions into actionable,
    grounded Next Best Actions with pedagogical justifications and dynamic source citations.
    """
    def __init__(self, db: Session):
        self.db = db

    def _get_resource_reference_for_topic(self, course_id: str, topic: str) -> str:
        # Look up real chunk in database for this course and topic
        chunk = self.db.query(DocumentChunk).filter(
            DocumentChunk.course_id == course_id,
            DocumentChunk.topic.ilike(f"%{topic}%")
        ).first()

        if chunk:
            if chunk.material_type == "pdf" and chunk.page_number:
                return f"{chunk.source_name} — Page {chunk.page_number}"
            elif chunk.material_type == "pptx" and chunk.slide_number:
                return f"{chunk.source_name} — Slide {chunk.slide_number}"
            elif chunk.material_type == "video" and chunk.video_timestamp:
                return f"{chunk.source_name} — Timestamp {chunk.video_timestamp}"
            return chunk.source_name

        # Fallback to any material in the course
        mat = self.db.query(Material).filter(Material.course_id == course_id).first()
        if mat:
            return mat.title

        return "Course Learning Materials"

    def generate_recommendations(self, user_id: str, course_id: str) -> List[Recommendation]:
        # Delete prior stale recommendations for this course
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
            res_ref = self._get_resource_reference_for_topic(course_id, misc.topic)
            rec = Recommendation(
                user_id=user_id,
                course_id=course_id,
                title=f"Resolve Misconception in {misc.topic}",
                description=f"Review the concept '{misc.concept or misc.topic}' to clear the flaw: {misc.misconception_name}.",
                reason=f"Recommended because you exhibited a conceptual gap during recent assessments on '{misc.misconception_name}'.",
                action_type="review_concept",
                target_topic=misc.topic,
                target_resource=res_ref,
                priority=1
            )
            self.db.add(rec)
            recs.append(rec)

        # 2. Topic Mastery-based recommendations for attempted topics
        attempted_masteries = [m for m in masteries if m.total_attempts > 0]

        for m in attempted_masteries:
            pct = int(m.mastery_score * 100)
            res_ref = self._get_resource_reference_for_topic(course_id, m.topic)

            if m.mastery_score < 0.40:
                rec = Recommendation(
                    user_id=user_id,
                    course_id=course_id,
                    title=f"Strengthen Foundations in {m.topic}",
                    description=f"Review material on {m.topic} and solve foundational practice questions.",
                    reason=f"Recommended because your current mastery in {m.topic} is {pct}% (below the 40% proficiency threshold) across {m.total_attempts} attempts.",
                    action_type="review_concept",
                    target_topic=m.topic,
                    target_resource=res_ref,
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
                    reason=f"Recommended because your mastery is developing at {pct}%. An adaptive quiz will reinforce your intuition.",
                    action_type="practice_easy",
                    target_topic=m.topic,
                    target_resource=res_ref,
                    priority=2
                )
                self.db.add(rec)
                recs.append(rec)
            else:
                rec = Recommendation(
                    user_id=user_id,
                    course_id=course_id,
                    title=f"Advance to Next Concept in {m.topic}",
                    description=f"You have demonstrated strong proficiency ({pct}%). Tackle advanced variations or progress to next dependent topics.",
                    reason=f"Recommended because you achieved {pct}% mastery with {m.correct_attempts}/{m.total_attempts} correct answers.",
                    action_type="challenge_quiz",
                    target_topic=m.topic,
                    target_resource=res_ref,
                    priority=3
                )
                self.db.add(rec)
                recs.append(rec)

        # 3. If student has unattempted topics in the course, recommend starting practice on first topic
        unattempted = [m for m in masteries if m.total_attempts == 0]
        if not recs and unattempted:
            first_unattempted = unattempted[0]
            res_ref = self._get_resource_reference_for_topic(course_id, first_unattempted.topic)
            rec = Recommendation(
                user_id=user_id,
                course_id=course_id,
                title=f"Begin Practice on {first_unattempted.topic}",
                description=f"Take an introductory practice quiz on {first_unattempted.topic} to calibrate your learner model.",
                reason="Recommended to establish your baseline understanding for this course topic.",
                action_type="practice_easy",
                target_topic=first_unattempted.topic,
                target_resource=res_ref,
                priority=1
            )
            self.db.add(rec)
            recs.append(rec)

        # 4. If course has no topics/materials at all
        if not recs:
            rec = Recommendation(
                user_id=user_id,
                course_id=course_id,
                title="Upload Course Documents",
                description="Upload lecture slides, notes, or textbooks to unlock source-grounded tutoring and adaptive assessments.",
                reason="Materials are needed to build your knowledge map and personalized study pathway.",
                action_type="review_concept",
                target_topic="Course Materials",
                target_resource="",
                priority=1
            )
            self.db.add(rec)
            recs.append(rec)

        self.db.commit()
        return recs
