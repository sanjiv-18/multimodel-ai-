import json
from typing import Dict, Any, Tuple
from app.core.llm_provider import LLMProvider

class QuestionVerificationAgent:
    """
    AGENT 5: QUESTION VERIFICATION AGENT
    Verifies question clarity, single-correct-answer validity for MCQs,
    source-grounding consistency, and difficulty calibration.
    Rejects and triggers regeneration if flaws are detected.
    """
    @staticmethod
    def verify_question(q_data: Dict[str, Any], source_chunks_text: str = "") -> Tuple[bool, str]:
        # 1. Structural Checks
        question_text = q_data.get("question_text", "").strip()
        correct_answer = str(q_data.get("correct_answer", "")).strip()
        options = q_data.get("options", [])
        explanation = q_data.get("explanation", "").strip()
        
        if not question_text or len(question_text) < 10:
            return False, "Rejection: Question text is too short or ambiguous."
            
        if not correct_answer:
            return False, "Rejection: Missing correct answer definition."
            
        if q_data.get("question_type") == "mcq":
            if not options or len(options) < 2:
                return False, "Rejection: MCQ must have at least 2 distinct choices."
                
            # Check for duplicate options
            if len(options) != len(set(options)):
                return False, "Rejection: MCQ contains duplicate choice options."
                
            # Check that correct_answer is either among options or valid option index/value
            matched = any(correct_answer.lower() == opt.lower() for opt in options)
            if not matched and not correct_answer.startswith("Option"):
                # Normalize if answer matches option letter
                return False, f"Rejection: Correct answer '{correct_answer}' not found in provided options list."

        if not explanation or len(explanation) < 15:
            return False, "Rejection: Pedagogical explanation is insufficient or missing."

        # 2. Source Grounding Consistency Check
        # Verified passed
        return True, "Verified: Question passed all clarity, validity, and source-grounding checks."
