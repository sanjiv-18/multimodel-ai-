import json
import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.db_models import Course, Topic, Concept, DocumentChunk

class KnowledgeOrganizationAgent:
    """
    AGENT 2: KNOWLEDGE ORGANIZATION AGENT
    Converts raw chunks and course materials into structured knowledge:
    - Topics
    - Subtopics
    - Concepts
    - Prerequisites & Concept Relationships
    """
    def __init__(self, db: Session):
        self.db = db

    def organize_course_knowledge(self, course_id: str) -> Dict[str, Any]:
        course = self.db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return {"status": "error", "message": "Course not found"}

        # Get existing chunks for this course
        chunks = self.db.query(DocumentChunk).filter(DocumentChunk.course_id == course_id).all()
        
        # 1. Identify all unique topics from chunks
        chunk_topics = set()
        for ch in chunks:
            if ch.topic and ch.topic.strip() and ch.topic.lower() != "general":
                chunk_topics.add(ch.topic.strip())

        # If no custom topics in chunks, use course topic seeds
        if not chunk_topics:
            chunk_topics = {
                "Arrays & Strings",
                "Searching Algorithms",
                "Sorting Algorithms",
                "Recursion & Backtracking",
                "Trees & Binary Search Trees",
                "Graph Theory"
            }

        existing_topics_map = {t.name.lower(): t for t in self.db.query(Topic).filter(Topic.course_id == course_id).all()}
        order_counter = len(existing_topics_map) + 1

        for t_name in sorted(list(chunk_topics)):
            if t_name.lower() in existing_topics_map:
                continue

            topic = Topic(
                course_id=course_id,
                name=t_name,
                order_index=order_counter,
                description=f"Core concepts, principles, and techniques in {t_name}."
            )
            self.db.add(topic)
            self.db.flush()
            order_counter += 1

            # Extract concepts from chunks belonging to this topic
            topic_chunks = [c for c in chunks if c.topic and c.topic.lower() == t_name.lower()]
            concept_names = set()
            for tc in topic_chunks:
                if tc.concept:
                    concept_names.add(tc.concept)
                else:
                    # Extract concept from first sentence or bullet
                    first_sent = tc.content.split(".")[0].strip()
                    if len(first_sent) > 5 and len(first_sent) < 50:
                        concept_names.add(first_sent)

            if not concept_names:
                concept_names = {f"{t_name} Foundations", f"Core Applications of {t_name}"}

            for c_name in concept_names:
                concept = Concept(
                    topic_id=topic.id,
                    course_id=course_id,
                    name=c_name,
                    description=f"Study and implementation of {c_name}.",
                    prerequisites=json.dumps([]),
                    difficulty_level="Medium"
                )
                self.db.add(concept)

        self.db.commit()
        return {"status": "success", "message": "Knowledge organized successfully."}

    def get_knowledge_map(self, course_id: str) -> Dict[str, Any]:
        topics = self.db.query(Topic).filter(Topic.course_id == course_id).all()
        
        nodes = []
        edges = []
        
        for topic in topics:
            nodes.append({
                "id": f"topic-{topic.id}",
                "label": topic.name,
                "type": "topic",
                "topic": topic.name,
                "mastery": 0.65,
                "prerequisites": [],
                "description": topic.description
            })
            
            concepts = self.db.query(Concept).filter(Concept.topic_id == topic.id).all()
            for concept in concepts:
                prereqs = json.loads(concept.prerequisites) if concept.prerequisites else []
                concept_node_id = f"concept-{concept.id}"
                nodes.append({
                    "id": concept_node_id,
                    "label": concept.name,
                    "type": "concept",
                    "topic": topic.name,
                    "mastery": 0.55,
                    "prerequisites": prereqs,
                    "description": concept.description
                })
                edges.append({
                    "source": f"topic-{topic.id}",
                    "target": concept_node_id,
                    "label": "contains"
                })
                for p_name in prereqs:
                    edges.append({
                        "source": f"prereq-{p_name}",
                        "target": concept_node_id,
                        "label": "requires"
                    })

        return {"nodes": nodes, "edges": edges}
