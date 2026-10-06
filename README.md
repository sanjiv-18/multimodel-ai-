# LearnFlow AI — Adaptive Multi-Agent Personal Tutor

[![Multimodal AI Hackathon 2026](https://img.shields.io/badge/Hackathon-Track%20D%3A%20Personalized%20Tutoring-indigo)](https://github.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC.svg)](https://tailwindcss.com/)
[![LangGraph](https://img.shields.io/badge/Orchestration-LangGraph%20Multi--Agent-orange)](https://github.com/langchain-ai/langgraph)

**LearnFlow AI** is a complete, working, demo-ready web application built for the **Multimodal AI Hackathon 2026, Track D: "Personalized Tutoring & Adaptive Learning"**.

It transforms scattered course material (PDF textbooks, PPTX slide decks, lecture video recordings) into an intelligent source-grounded knowledge base, powered by **8 logical AI agents** orchestrated through a unified **LangGraph** feedback loop.

---

## 🚀 The Core Learning Loop

```
  ┌─────────────────────────────────────────────────────────┐
  │                      LEARNFLOW AI                       │
  │                                                         │
  │   Ingest Multimodal Course Material (PDF / PPT / Video) │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 1. Multimodal Ingestion Agent & Knowledge Organizer     │
  │    • Preserves exact PDF pages, slide #s, timestamps    │
  │    • Builds topic & prerequisite dependency graph       │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 2. Grounded AI Tutor Agent (RAG + Clickable Citations)  │
  │    • Strict source grounding with verification checks   │
  │    • Refusal integrity on out-of-domain queries         │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 3. Adaptive Assessment & Question Verification Pipeline │
  │    • Agent 4: Generates MCQ / Problems by Mastery       │
  │    • Agent 5: Verifies clarity & single-answer validity │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 4. Misconception Diagnosis & Learner Modeling           │
  │    • Agent 6: Pinpoints exact conceptual flaw           │
  │    • Agent 7: Transparent Bayesian/EMA mastery update   │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 5. Personalization Agent (Next Best Actions)            │
  │    • Actionable recommendations with pedagogical "WHY"  │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
                      Repeat & Master ↺
```

---

## 🧠 The 8 Logical AI Agents

| Agent | Name | Responsibility |
|---|---|---|
| **Agent 1** | **Multimodal Ingestion Agent** | Extracts text from PDFs, PPTX slides, and video transcripts, preserving exact source metadata (`source_name`, `page_number`, `slide_number`, `video_timestamp`). |
| **Agent 2** | **Knowledge Organization Agent** | Structures unstructured material into Topics, Subtopics, Concepts, and Prerequisite dependency graphs. |
| **Agent 3** | **Grounded Tutor Agent** | RAG retrieval engine with strict source grounding, clickable citations `[Textbook.pdf — Page 42]`, and refusal on out-of-domain queries. |
| **Agent 4** | **Assessment Generation Agent** | Generates calibrated MCQs, problem-solving, and conceptual questions across Easy, Medium, and Hard difficulty bands. |
| **Agent 5** | **Question Verification Agent** | Validates generated questions for single-answer correctness, pedagogical clarity, and source alignment before presenting to the learner (Reject $\rightarrow$ Regenerate loop). |
| **Agent 6** | **Misconception Analysis Agent** | Analyzes incorrect student attempts against course concepts to diagnose the root conceptual misunderstanding. |
| **Agent 7** | **Learner Model Agent** | Calculates real-time topic mastery scores ($0.05 \le M \le 0.99$) with difficulty calibration and mistake penalties. |
| **Agent 8** | **Personalization Agent** | Generates targeted Next Best Actions (foundational reviews, intermediate practice, challenge quizzes) with explicit pedagogical rationales. |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, React Router v6, Axios
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2, Python-Jose (JWT), Passlib
- **Orchestration**: LangGraph StateGraph pipeline
- **Vector Search & RAG**: Cosine Similarity Vector Store with TF-IDF / Subword embeddings, with native support for OpenAI Embeddings and Ollama
- **Database**: SQLite (zero setup friction default) or PostgreSQL with pgvector
- **Containerization**: Docker, Docker Compose

---

## ⚡ Quick Start (Local Setup)

### 1. Prerequisites
- Python 3.11+
- Node.js v18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python requirements
pip install -r requirements.txt

# Initialize & Seed the Data Structures course database
python -m app.database.init_db

# Run the FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: **http://localhost:8000/docs**

### 3. Frontend Setup
```bash
# Navigate to frontend directory in a new terminal
cd frontend

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```
Web Application will be live at: **http://localhost:5173**

### 4. Or Run Both with One Command (Windows PowerShell)
```powershell
.\start.ps1
```

---

## 👤 Demo Credentials

- **Email**: `demo@learnflow.ai`
- **Password**: `demo1234`
- Or simply click **"Quick Demo Login"** on the landing page!

---

## 🧪 Running Automated Tests & Benchmarks

### 1. Run Unit & Agent Tests
```bash
cd backend
python -m pytest tests/
```
All 11 unit tests verify RAG retrieval, out-of-domain refusal, question generation, Agent 5 verification, misconception diagnosis, and learner mastery updates.

### 2. Run Built-in RAG Benchmark Suite
Navigate to **Evaluation & Benchmarks** in the UI (`/evaluation`) or trigger via API:
```bash
curl -X POST http://localhost:8000/api/evaluation/run
```

---

## 🎯 End-to-End Hackathon Demo Flow

1. **Login**: Click *Quick Demo Login* to enter as student *Alex Chen*.
2. **Dashboard**: View overall course mastery (65%), active course *Data Structures & Algorithms*, and personalized Next Best Actions.
3. **Materials Ingestion**: Inspect pre-indexed textbook PDFs, slide decks, and lecture recordings with exact timestamps.
4. **Knowledge Map**: Explore the interactive prerequisite graph and concept dependencies.
5. **Grounded AI Tutor**:
   - Ask: `"Explain binary search and its prerequisite."` $\rightarrow$ Receive grounded answer with citations `[Algorithms_Textbook.pdf — Page 42]` and `[Lecture_03_Searching.mp4 — Timestamp 14:22]`.
   - Click citation to open the interactive **Source Viewer Modal**.
   - Ask: `"How do I bake chocolate cookies?"` $\rightarrow$ Receive graceful out-of-domain source-grounding refusal without hallucinations.
6. **Adaptive Assessment**: Generate a quiz on *Searching Algorithms*.
7. **Misconception Diagnosis**: Answer incorrectly (e.g. claim array must contain positive integers) $\rightarrow$ Agent 6 diagnoses *Precondition Misunderstanding* and delivers remediation.
8. **Learner Mastery & Personalization**: Check *Learner Analytics* and *Personalized Next* $\rightarrow$ See updated topic mastery score and newly calibrated recommendations with explicit "WHY" rationales.
9. **Evaluation Dashboard**: Run the automated benchmark suite to observe Faithfulness, Relevancy, Citation Precision, and Refusal Reliability metrics.

---

## 🔒 Security & Best Practices

- Standard JWT token bearer authentication.
- Password hashing with PBKDF2/Bcrypt.
- Input validation and sanitized SQL queries via SQLAlchemy ORM.
- No API keys committed or exposed to the frontend client.

---

## 📄 License
Created for the Multimodal AI Hackathon 2026. Distributed under the MIT License.
