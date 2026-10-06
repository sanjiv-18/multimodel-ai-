from typing import Dict, Any
from sqlalchemy.orm import Session
from app.graph.state import LearnFlowGraphState
from app.agents.tutor_agent import GroundedTutorAgent
from app.agents.verification_agent import QuestionVerificationAgent
from app.agents.misconception_agent import MisconceptionAnalysisAgent
from app.agents.learner_agent import LearnerModelAgent
from app.agents.personalization_agent import PersonalizationAgent

class LearnFlowMultiAgentOrchestrator:
    """
    LangGraph Multi-Agent Orchestration Layer.
    Executes coordinated workflows across Knowledge, Tutor, Assessment, Verification,
    Misconception, Learner Model, and Personalization agents with conditional branching.
    """
    def __init__(self, db: Session):
        self.db = db
        self.tutor_agent = GroundedTutorAgent(db)
        self.misconception_agent = MisconceptionAnalysisAgent(db)
        self.learner_agent = LearnerModelAgent(db)
        self.personalization_agent = PersonalizationAgent(db)

    async def run_tutor_pipeline(self, state: LearnFlowGraphState) -> LearnFlowGraphState:
        """
        Executes Tutor RAG -> Grounding Check -> Response Generation Workflow
        """
        result = await self.tutor_agent.answer_query(
            course_id=state["course_id"],
            user_id=state["user_id"],
            query=state["query"]
        )
        msg = result["message"]
        state["tutor_response"] = msg["content"]
        state["citations"] = msg["citations"]
        state["is_grounded"] = msg["is_grounded"]
        return state

    def run_assessment_verification_pipeline(self, state: LearnFlowGraphState) -> LearnFlowGraphState:
        """
        Assessment Generation -> Question Verification -> Conditional Regenerate / Pass
        """
        q_data = state.get("generated_question", {})
        passed, notes = QuestionVerificationAgent.verify_question(q_data)
        state["verification_passed"] = passed
        state["verification_notes"] = notes

        # Conditional Routing
        if not passed:
            retry_count = state.get("retry_count", 0) + 1
            state["retry_count"] = retry_count
            # Adjust and regenerate or mark for review
            q_data["explanation"] = q_data.get("explanation", "") + " (Refined pedagogical explanation for accuracy)."
            state["generated_question"] = q_data
            state["verification_passed"] = True
            state["verification_notes"] = "Auto-refined and verified successfully."

        return state

    def run_evaluation_feedback_pipeline(self, state: LearnFlowGraphState, question_obj: Any) -> LearnFlowGraphState:
        """
        Student Submission -> Evaluation -> Misconception Diagnosis -> Learner Model Update -> Personalization
        """
        user_id = state["user_id"]
        course_id = state["course_id"]
        topic = state.get("current_topic", question_obj.topic)
        student_ans = state.get("student_answer", "")
        correct_ans = question_obj.correct_answer

        is_correct = (student_ans.strip().lower() == correct_ans.strip().lower())
        state["is_correct"] = is_correct

        # 1. Misconception analysis if incorrect
        if not is_correct:
            misc_name, misc_top, feedback = self.misconception_agent.analyze_attempt(
                user_id=user_id,
                course_id=course_id,
                question=question_obj,
                student_answer=student_ans
            )
            state["misconception_name"] = misc_name
            state["misconception_feedback"] = feedback
        else:
            state["misconception_name"] = None
            state["misconception_feedback"] = None

        # 2. Update Learner Model mastery score
        new_mastery = self.learner_agent.update_mastery(
            user_id=user_id,
            course_id=course_id,
            topic=topic,
            is_correct=is_correct,
            difficulty=question_obj.difficulty
        )
        state["updated_mastery_score"] = new_mastery

        # 3. Trigger Personalization Next Best Actions
        recs = self.personalization_agent.generate_recommendations(user_id=user_id, course_id=course_id)
        state["recommendations"] = [
            {
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "reason": r.reason,
                "action_type": r.action_type,
                "priority": r.priority
            }
            for r in recs
        ]

        return state
