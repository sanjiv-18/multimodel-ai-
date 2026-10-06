import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_get_courses_endpoint():
    response = client.get("/api/courses")
    assert response.status_code == 200
    courses = response.json()
    assert len(courses) > 0
    assert courses[0]["title"] == "Data Structures & Algorithms"

def test_get_topics_endpoint():
    # First get course id
    c_resp = client.get("/api/courses")
    course_id = c_resp.json()[0]["id"]
    
    response = client.get(f"/api/courses/{course_id}/topics")
    assert response.status_code == 200
    topics = response.json()
    assert len(topics) > 0

def test_learner_overview_endpoint():
    response = client.get("/api/students/me/overview")
    assert response.status_code == 200
    data = response.json()
    assert "overall_mastery" in data
    assert "topics_mastery" in data
    assert "recommendations" in data

def test_evaluation_endpoint():
    response = client.get("/api/evaluation/results")
    assert response.status_code == 200
    data = response.json()
    assert data["overall_score"] > 0
    assert len(data["metrics"]) > 0
