import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, init_db_tables
from app.models.db_models import User, Course, Material, DocumentChunk, Topic

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db_tables()

def test_registration_and_empty_state():
    # 1. Register fresh new student
    email = f"student_{uuid.uuid4().hex[:8]}@university.edu"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "SecurePassword123",
        "full_name": "Jordan Lee",
        "role": "student"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check courses list - must be empty
    courses_res = client.get("/api/courses", headers=headers)
    assert courses_res.status_code == 200
    assert len(courses_res.json()) == 0

    # 3. Check learner overview - must be honest empty state (0% mastery, 0 activity)
    overview_res = client.get("/api/students/me/overview", headers=headers)
    assert overview_res.status_code == 200
    data = overview_res.json()
    assert data["overall_mastery"] == 0.0
    assert data["recent_activity_count"] == 0
    assert len(data["topics_mastery"]) == 0
    assert len(data["active_misconceptions"]) == 0

def test_course_creation_and_material_flow():
    # Register user
    email = f"owner_{uuid.uuid4().hex[:8]}@university.edu"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Course Owner",
        "role": "student"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Course
    create_res = client.post("/api/courses", headers=headers, json={
        "title": "Computer Architecture",
        "code": "CS-304",
        "description": "Hardware organization, pipelining, cache memory, and instruction sets."
    })
    assert create_res.status_code == 200
    course = create_res.json()
    assert course["title"] == "Computer Architecture"
    assert course["mastery_avg"] == 0.0
    course_id = course["id"]

    # Upload material note
    file_content = b"# Cache Memory\nDirect-mapped, set-associative, and fully-associative caches optimize CPU hit rates.\n# Pipelining\nInstruction pipelining introduces hazards: data hazards, structural hazards, and control hazards."
    upload_res = client.post(
        f"/api/courses/{course_id}/materials",
        headers=headers,
        files={"file": ("architecture_notes.txt", file_content, "text/plain")},
        data={"title": "Architecture Notes"}
    )
    assert upload_res.status_code == 200
    mat = upload_res.json()
    assert mat["status"] == "completed"
    assert mat["chunks_count"] > 0

    # Verify extracted topics
    topics_res = client.get(f"/api/courses/{course_id}/topics", headers=headers)
    assert topics_res.status_code == 200
    topics = topics_res.json()
    assert len(topics) >= 1

    # Ask grounded question in Tutor
    chat_res = client.post(f"/api/courses/{course_id}/chat", headers=headers, json={
        "message": "What types of hazards occur in instruction pipelining?"
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["message"]["is_grounded"] is True
    assert len(chat_data["message"]["citations"]) > 0

    # Generate Assessment
    ass_res = client.post(f"/api/courses/{course_id}/assessments/generate", headers=headers, json={
        "topic": topics[0]["name"],
        "difficulty": "Medium",
        "num_questions": 2,
        "adaptive_mode": True
    })
    assert ass_res.status_code == 200
    ass = ass_res.json()
    assert len(ass["questions"]) >= 1

    # Submit assessment answer
    q = ass["questions"][0]
    submit_res = client.post(f"/api/assessments/{ass['id']}/submit", headers=headers, json={
        "submissions": [{"question_id": q["id"], "student_answer": q["options"][0] if q["options"] else "Answer"}]
    })
    assert submit_res.status_code == 200
    sub_data = submit_res.json()
    assert sub_data["total_questions"] == 1
    assert "updated_mastery" in sub_data

def test_user_data_isolation():
    # User A
    user_a_email = f"alpha_{uuid.uuid4().hex[:8]}@test.com"
    client.post("/api/auth/register", json={"email": user_a_email, "password": "Pass123!", "full_name": "Alpha"})
    tok_a = client.post("/api/auth/login", json={"email": user_a_email, "password": "Pass123!"}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {tok_a}"}

    # User B
    user_b_email = f"beta_{uuid.uuid4().hex[:8]}@test.com"
    client.post("/api/auth/register", json={"email": user_b_email, "password": "Pass123!", "full_name": "Beta"})
    tok_b = client.post("/api/auth/login", json={"email": user_b_email, "password": "Pass123!"}).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {tok_b}"}

    # User A creates a course
    c_res = client.post("/api/courses", headers=headers_a, json={"title": "Alpha Private Course"})
    assert c_res.status_code == 200
    alpha_course_id = c_res.json()["id"]

    # User B lists courses - must NOT see Alpha's private course
    b_courses = client.get("/api/courses", headers=headers_b).json()
    b_course_ids = [c["id"] for c in b_courses]
    assert alpha_course_id not in b_course_ids

def test_material_and_course_deletion():
    email = f"deleter_{uuid.uuid4().hex[:8]}@university.edu"
    client.post("/api/auth/register", json={"email": email, "password": "Password123!", "full_name": "Deleter"})
    token = client.post("/api/auth/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Course
    course = client.post("/api/courses", headers=headers, json={"title": "To Delete Course"}).json()
    course_id = course["id"]

    # Upload material
    mat = client.post(
        f"/api/courses/{course_id}/materials",
        headers=headers,
        files={"file": ("temp_notes.txt", b"Transient note content for deletion test.", "text/plain")},
        data={"title": "Temp Note"}
    ).json()
    mat_id = mat["id"]

    # Verify material exists
    mats_before = client.get(f"/api/courses/{course_id}/materials", headers=headers).json()
    assert any(m["id"] == mat_id for m in mats_before)

    # Delete material
    del_mat_res = client.delete(f"/api/materials/{mat_id}", headers=headers)
    assert del_mat_res.status_code == 200

    # Verify material no longer listed
    mats_after = client.get(f"/api/courses/{course_id}/materials", headers=headers).json()
    assert not any(m["id"] == mat_id for m in mats_after)

    # Delete course
    del_course_res = client.delete(f"/api/courses/{course_id}", headers=headers)
    assert del_course_res.status_code == 200

    # Verify course no longer in list
    courses_after = client.get("/api/courses", headers=headers).json()
    assert not any(c["id"] == course_id for c in courses_after)

def test_duplicate_assessment_submission_rejected():
    email = f"exam_{uuid.uuid4().hex[:8]}@university.edu"
    client.post("/api/auth/register", json={"email": email, "password": "Password123!", "full_name": "Examinee"})
    token = client.post("/api/auth/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Course and Material
    course = client.post("/api/courses", headers=headers, json={"title": "Exam Prep"}).json()
    course_id = course["id"]
    client.post(
        f"/api/courses/{course_id}/materials",
        headers=headers,
        files={"file": ("quiz_notes.txt", b"# Logic Gates\nAND, OR, NOT, XOR gates form digital combinational circuits.", "text/plain")},
        data={"title": "Digital Logic"}
    )

    # Generate Assessment
    topics = client.get(f"/api/courses/{course_id}/topics", headers=headers).json()
    topic_name = topics[0]["name"] if topics else "Logic Gates"

    ass = client.post(f"/api/courses/{course_id}/assessments/generate", headers=headers, json={
        "topic": topic_name,
        "difficulty": "Easy",
        "num_questions": 1,
        "adaptive_mode": False
    }).json()

    q_id = ass["questions"][0]["id"]
    sub_payload = {"submissions": [{"question_id": q_id, "student_answer": "AND"}]}

    # First submission -> 200 OK
    res1 = client.post(f"/api/assessments/{ass['id']}/submit", headers=headers, json=sub_payload)
    assert res1.status_code == 200

    # Second submission on same assessment -> must be 400 Bad Request
    res2 = client.post(f"/api/assessments/{ass['id']}/submit", headers=headers, json=sub_payload)
    assert res2.status_code == 400

