import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="student")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    courses = relationship("Course", back_populates="creator")
    attempts = relationship("QuestionAttempt", back_populates="user")
    mastery_records = relationship("LearnerMastery", back_populates="user")
    misconceptions = relationship("Misconception", back_populates="user")
    recommendations = relationship("Recommendation", back_populates="user")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    code = Column(String, nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    creator = relationship("User", back_populates="courses")
    materials = relationship("Material", back_populates="course", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="course", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="course", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="course", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="course", cascade="all, delete-orphan")

class Material(Base):
    __tablename__ = "materials"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "pdf", "pptx", "video"
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, default=0)
    status = Column(String, default="uploaded")  # "uploaded", "processing", "completed", "error"
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="materials")
    chunks = relationship("DocumentChunk", back_populates="material", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    material_id = Column(String, ForeignKey("materials.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    content = Column(Text, nullable=False)
    source_name = Column(String, nullable=False)
    material_type = Column(String, nullable=False)  # "pdf", "pptx", "video"
    page_number = Column(Integer, nullable=True)
    slide_number = Column(Integer, nullable=True)
    video_timestamp = Column(String, nullable=True)  # e.g., "14:22"
    topic = Column(String, nullable=True)
    concept = Column(String, nullable=True)
    embedding_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    material = relationship("Material", back_populates="chunks")
    course = relationship("Course", back_populates="chunks")

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    parent_id = Column(String, ForeignKey("topics.id"), nullable=True)
    
    course = relationship("Course", back_populates="topics")
    concepts = relationship("Concept", back_populates="topic", cascade="all, delete-orphan")
    subtopics = relationship("Topic", remote_side=[id])

class Concept(Base):
    __tablename__ = "concepts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    prerequisites = Column(Text, default="[]")  # JSON string array of concept names
    difficulty_level = Column(String, default="Medium")  # Easy, Medium, Hard
    
    topic = relationship("Topic", back_populates="concepts")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="Learning Session")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender = Column(String, nullable=False)  # "user" or "tutor"
    content = Column(Text, nullable=False)
    citations_json = Column(Text, default="[]")  # JSON array of citation objects
    is_grounded = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    conversation = relationship("Conversation", back_populates="messages")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    topic = Column(String, nullable=False)
    difficulty = Column(String, default="Medium")
    total_questions = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="assessments")
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    attempts = relationship("QuestionAttempt", back_populates="assessment", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="mcq")  # "mcq", "short_answer", "problem_solving"
    options_json = Column(Text, default="[]")  # JSON array of option strings for MCQ
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    topic = Column(String, nullable=False)
    concept = Column(String, nullable=True)
    difficulty = Column(String, default="Medium")
    source_reference = Column(String, nullable=True)  # e.g., "Algorithms.pdf — Page 42"
    is_verified = Column(Boolean, default=True)
    verification_notes = Column(Text, nullable=True)
    
    assessment = relationship("Assessment", back_populates="questions")
    attempts = relationship("QuestionAttempt", back_populates="question", cascade="all, delete-orphan")

class QuestionAttempt(Base):
    __tablename__ = "question_attempts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    student_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    score = Column(Float, default=0.0)
    misconception_detected = Column(Text, nullable=True)
    misconception_topic = Column(String, nullable=True)
    misconception_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="attempts")
    assessment = relationship("Assessment", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")

class LearnerMastery(Base):
    __tablename__ = "learner_mastery"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    topic = Column(String, nullable=False)
    concept = Column(String, nullable=True)
    mastery_score = Column(Float, default=0.5)  # 0.0 to 1.0
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="mastery_records")

class Misconception(Base):
    __tablename__ = "misconceptions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    topic = Column(String, nullable=False)
    concept = Column(String, nullable=True)
    misconception_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    count = Column(Integer, default=1)
    resolved = Column(Boolean, default=False)
    last_detected_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="misconceptions")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    action_type = Column(String, default="review_concept")  # "review_concept", "watch_video", "practice_easy", "challenge_quiz"
    target_topic = Column(String, nullable=True)
    target_resource = Column(String, nullable=True)
    priority = Column(Integer, default=1)  # 1 (high), 2 (med), 3 (low)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="recommendations")
