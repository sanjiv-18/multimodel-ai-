import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, init_db_tables
from app.database.init_db import seed_database
from app.models.db_models import User, Course

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_api_test():
    init_db_tables()
    seed_database()

@pytest.fixture(scope="module")
def auth_headers():
    res = client.post("/api/auth/register", json={
        "email": "api_test_student@example.com",
        "password": "Password123!",
        "full_name": "API Tester",
        "role": "student"
    })
    if res.status_code == 400:
        login_res = client.post("/api/auth/login", json={
            "email": "api_test_student@example.com",
            "password": "Password123!"
        })
        token = login_res.json()["access_token"]
    else:
        token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_unauthenticated_request_rejected():
    response = client.get("/api/courses")
    assert response.status_code == 401

def test_get_courses_endpoint(auth_headers):
    # Create course for this tester
    client.post("/api/courses", headers=auth_headers, json={
        "title": "API Test Algorithms",
        "code": "CS-101",
        "description": "Algorithms testing"
    })
    response = client.get("/api/courses", headers=auth_headers)
    assert response.status_code == 200
    courses = response.json()
    assert len(courses) > 0

def test_get_topics_endpoint(auth_headers):
    # Retrieve user's courses
    courses = client.get("/api/courses", headers=auth_headers).json()
    assert len(courses) > 0
    course_id = courses[0]["id"]
    
    response = client.get(f"/api/courses/{course_id}/topics", headers=auth_headers)
    assert response.status_code == 200
    topics = response.json()
    assert isinstance(topics, list)


def test_learner_overview_endpoint(auth_headers):
    response = client.get("/api/students/me/overview", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "overall_mastery" in data
    assert "topics_mastery" in data
    assert "recommendations" in data

def test_evaluation_endpoint(auth_headers):
    response = client.get("/api/evaluation/results", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_score"] > 0
    assert len(data["metrics"]) > 0
