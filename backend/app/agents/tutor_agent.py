import json
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.rag.retriever import CourseRetriever
from app.core.llm_provider import LLMProvider
from app.models.db_models import Conversation, Message
from app.schemas.pydantic_schemas import Citation

class GroundedTutorAgent:
    """
    AGENT 3: GROUNDED TUTOR AGENT
    Performs RAG against uploaded course chunks.
    Enforces strict source grounding, generates clickable citations,
    and returns graceful refusal when query is out-of-domain.
    """
    def __init__(self, db: Session):
        self.db = db
        self.retriever = CourseRetriever(db)

    async def answer_query(
        self,
        course_id: str,
        user_id: str,
        query: str,
        conversation_id: str = None
    ) -> Dict[str, Any]:
        # 1. Retrieve grounded context
        context_paragraphs, citations, is_supported = self.retriever.retrieve_grounded_context(
            course_id=course_id,
            query=query,
            top_k=4,
            min_relevance_threshold=0.15
        )

        # 2. If out of domain / not supported in uploaded material
        if not is_supported or not context_paragraphs:
            refusal_text = (
                "I couldn't find this information in your uploaded course material. "
                "To maintain strict academic integrity and source grounding, I only answer questions "
                "based on your uploaded textbooks, slide decks, and lecture recordings. "
                "Please upload relevant materials or ask about topics covered in this course."
            )
            
            # Save message
            conv = self._get_or_create_conversation(course_id, user_id, conversation_id, query)
            self._save_message(conv.id, "user", query, [], True)
            tutor_msg = self._save_message(conv.id, "tutor", refusal_text, [], False)

            return {
                "conversation_id": conv.id,
                "message": {
                    "id": tutor_msg.id,
                    "sender": "tutor",
                    "content": refusal_text,
                    "citations": [],
                    "is_grounded": False,
                    "created_at": tutor_msg.created_at
                }
            }

        # 3. Generate grounded answer
        system_prompt = (
            "You are LearnFlow AI Grounded Tutor. Answer the student's question using ONLY the provided course excerpts. "
            "Cite your sources precisely in brackets, e.g. [DataStructures.pdf — Page 14] or [Lecture 01 — 14:22]. "
            "Do NOT extrapolate beyond the given context. If a detail is missing, state it clearly."
        )

        rag_context_str = "\n\n---\n\n".join(context_paragraphs)
        user_prompt = f"COURSE MATERIAL EXCERPTS:\n{rag_context_str}\n\nSTUDENT QUESTION:\n{query}\n\nGROUNDED TUTOR EXPLANATION:"

        raw_answer = await LLMProvider.generate_response(user_prompt, system_prompt=system_prompt)

        # Append structured citation summary if not present
        citation_dicts = [c.model_dump() if hasattr(c, "model_dump") else c.dict() for c in citations]
        
        # Save to DB
        conv = self._get_or_create_conversation(course_id, user_id, conversation_id, query)
        self._save_message(conv.id, "user", query, [], True)
        tutor_msg = self._save_message(conv.id, "tutor", raw_answer, citation_dicts, True)

        return {
            "conversation_id": conv.id,
            "message": {
                "id": tutor_msg.id,
                "sender": "tutor",
                "content": raw_answer,
                "citations": citation_dicts,
                "is_grounded": True,
                "created_at": tutor_msg.created_at
            }
        }

    def _get_or_create_conversation(self, course_id: str, user_id: str, conv_id: str, query: str) -> Conversation:
        if conv_id:
            conv = self.db.query(Conversation).filter(Conversation.id == conv_id).first()
            if conv:
                return conv
        # Create new
        title = query[:40] + "..." if len(query) > 40 else query
        new_conv = Conversation(course_id=course_id, user_id=user_id, title=title)
        self.db.add(new_conv)
        self.db.commit()
        self.db.refresh(new_conv)
        return new_conv

    def _save_message(self, conv_id: str, sender: str, content: str, citations: list, is_grounded: bool) -> Message:
        msg = Message(
            conversation_id=conv_id,
            sender=sender,
            content=content,
            citations_json=json.dumps(citations),
            is_grounded=is_grounded
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg
