import pytest
from app.database.session import SessionLocal, init_db_tables
from app.database.init_db import seed_database
from app.models.db_models import Course, User, DocumentChunk
from app.rag.retriever import CourseRetriever
from app.agents.tutor_agent import GroundedTutorAgent

@pytest.fixture(scope="module")
def db_session():
    init_db_tables()
    seed_database()
    db = SessionLocal()
    yield db
    db.close()

def test_course_retriever_grounded_query(db_session):
    # Find chunk with binary search
    chunk = db_session.query(DocumentChunk).filter(DocumentChunk.content.ilike("%binary search%")).first()
    assert chunk is not None, "DSA chunks should be seeded"

    retriever = CourseRetriever(db_session)
    chunks, citations, is_supported = retriever.retrieve_grounded_context(
        course_id=chunk.course_id,
        query="What is binary search and its prerequisite?",
        top_k=3
    )

    assert is_supported is True
    assert len(citations) > 0
    # Check that citation contains source_name and page/slide/timestamp
    first_cit = citations[0]
    assert first_cit.source_name != ""
    assert (first_cit.page_number is not None or first_cit.slide_number is not None or first_cit.video_timestamp is not None)

def test_course_retriever_unsupported_query(db_session):
    chunk = db_session.query(DocumentChunk).first()
    assert chunk is not None
    retriever = CourseRetriever(db_session)
    chunks, citations, is_supported = retriever.retrieve_grounded_context(
        course_id=chunk.course_id,
        query="How do I bake a chocolate cake with chocolate icing?",
        min_relevance_threshold=0.30
    )
    # Cake baking is not in DSA course material
    assert is_supported is False or len(citations) == 0

def test_tutor_agent_refusal_on_out_of_domain(db_session):
    import asyncio
    chunk = db_session.query(DocumentChunk).first()
    assert chunk is not None
    user = db_session.query(User).first()
    tutor = GroundedTutorAgent(db_session)

    res = asyncio.run(tutor.answer_query(
        course_id=chunk.course_id,
        user_id=user.id,
        query="Explain quantum computing qubits and cryogenic entanglement."
    ))

    msg = res["message"]
    assert msg["is_grounded"] is False
    assert len(msg["citations"]) == 0
    assert "couldn't find" in msg["content"].lower()
