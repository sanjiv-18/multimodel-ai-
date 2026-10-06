from typing import TypedDict, List, Dict, Any, Optional

class LearnFlowGraphState(TypedDict, total=False):
    # Context IDs
    course_id: str
    user_id: str
    
    # Tutor Chat Flow
    query: str
    retrieved_context: List[str]
    citations: List[Dict[str, Any]]
    is_grounded: bool
    tutor_response: str
    conversation_history: List[Dict[str, str]]
    
    # Knowledge & Assessment Flow
    current_topic: str
    current_concept: Optional[str]
    difficulty: str
    generated_question: Dict[str, Any]
    verification_passed: bool
    verification_notes: str
    retry_count: int
    
    # Learner Evaluation Flow
    student_answer: str
    is_correct: bool
    explanation: str
    misconception_name: Optional[str]
    misconception_feedback: Optional[str]
    updated_mastery_score: float
    recommendations: List[Dict[str, Any]]
