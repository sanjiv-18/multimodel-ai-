import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.db_models import Topic, Concept, LearnerMastery, User
from app.schemas.pydantic_schemas import TopicOut, ConceptOut, KnowledgeMapOut
from app.agents.knowledge_agent import KnowledgeOrganizationAgent
from app.api.auth import get_current_user

router = APIRouter(prefix="/courses/{course_id}", tags=["Knowledge Map & Topics"])

@router.get("/topics", response_model=List[TopicOut])
def get_course_topics(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topics = db.query(Topic).filter(Topic.course_id == course_id).order_by(Topic.order_index).all()
    results = []
    
    for t in topics:
        concepts = db.query(Concept).filter(Concept.topic_id == t.id).all()
        concept_outs = []
        for c in concepts:
            prereqs = json.loads(c.prerequisites) if c.prerequisites else []
            concept_outs.append(ConceptOut(
                id=c.id,
                topic_id=c.topic_id,
                name=c.name,
                description=c.description,
                prerequisites=prereqs,
                difficulty_level=c.difficulty_level
            ))
            
        mastery = db.query(LearnerMastery).filter(
            LearnerMastery.user_id == current_user.id,
            LearnerMastery.course_id == course_id,
            LearnerMastery.topic == t.name
        ).first()
        mastery_val = mastery.mastery_score if mastery else 0.50

        results.append(TopicOut(
            id=t.id,
            course_id=t.course_id,
            name=t.name,
            description=t.description,
            order_index=t.order_index,
            parent_id=t.parent_id,
            concepts=concept_outs,
            mastery=mastery_val
        ))
        
    return results

@router.get("/knowledge-map", response_model=KnowledgeMapOut)
def get_knowledge_map(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = KnowledgeOrganizationAgent(db)
    raw_map = agent.get_knowledge_map(course_id)
    return raw_map
