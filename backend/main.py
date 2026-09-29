from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_connection
from tools import get_student_state, get_syllabus, get_progress, calculate_available_time, get_latest_plan
from agent import create_basic_plan, run_agent, handle_missed_session, handle_poor_performance
from models import PerformanceInput, SessionCreate

app = FastAPI(title="StudyPilot API - Final Integrated Build")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def root():
    return {"message": "StudyPilot Backend Running - Final Integrated Build"}


@app.get("/health")
def health():
    return {"status": "ok", "phase": "agentic"}


@app.get("/student")
def student():
    return get_student_state()


@app.get("/subjects")
def subjects():
    conn = get_connection()
    rows = conn.execute("SELECT DISTINCT subject FROM topics ORDER BY subject").fetchall()
    conn.close()
    return [{"name": r["subject"]} for r in rows]


@app.get("/topics")
def topics(subject: str | None = None):
    conn = get_connection()
    if subject:
        rows = conn.execute(
            "SELECT * FROM topics WHERE subject=? ORDER BY difficulty DESC, name", (subject,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM topics ORDER BY difficulty DESC, name").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/progress")
def progress():
    return get_progress()


@app.get("/available-time")
def available_time():
    s = get_student_state()
    return {"daily_hours": s["daily_hours"], "five_day_hours": calculate_available_time()}


@app.get("/sessions")
def sessions():
    conn = get_connection()
    rows = conn.execute("""
        SELECT s.*, t.name AS topic_name
        FROM study_sessions s JOIN topics t ON t.id=s.topic_id
        ORDER BY s.session_date, s.id
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/sessions")
def create_session(data: SessionCreate):
    conn = get_connection()
    topic = conn.execute("SELECT id, name FROM topics WHERE id=?", (data.topic_id,)).fetchone()
    if not topic:
        conn.close()
        return {"error": "Topic not found"}
    cur = conn.execute(
        "INSERT INTO study_sessions(topic_id, session_date, duration, status, performance) VALUES (?, ?, ?, 'planned', NULL)",
        (data.topic_id, data.session_date, data.duration),
    )
    conn.commit()
    session_id = cur.lastrowid
    conn.close()
    return {"status": "created", "session_id": session_id, "topic": topic["name"]}


@app.get("/plan")
def plan():
    return {"latest_plan": get_latest_plan()}


@app.post("/plan/create")
def create_plan():
    return run_agent("Initial AI agent study plan", update=False)


@app.post("/agent/run")
def agent_run():
    return run_agent("AI agent generated plan", update=False)


@app.post("/agent/replan")
def agent_replan():
    return run_agent("AI agent updated the study plan", update=True)


@app.get("/agent/trace")
def agent_trace():
    latest = get_latest_plan()
    if not latest:
        return {"trace": ["No agent plan has been generated yet."]}
    return {
        "trace": [
            "✓ Retrieved student state",
            "✓ Checked syllabus",
            "✓ Reviewed progress",
            "✓ Calculated available study time",
            "✓ Prioritised topics",
            "✓ Generated study schedule",
            f"✓ Loaded Plan v{latest['version']}",
        ]
    }


@app.post("/sessions/{session_id}/complete")
def complete_session(session_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM study_sessions WHERE id=?", (session_id,)).fetchone()
    if not row:
        conn.close()
        return {"error": "Session not found"}
    conn.execute("UPDATE study_sessions SET status='completed' WHERE id=?", (session_id,))
    conn.commit()
    conn.close()
    return {"status": "completed", "session_id": session_id}


@app.post("/sessions/{session_id}/miss")
def miss_session(session_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT s.*, t.name AS topic_name FROM study_sessions s JOIN topics t ON t.id=s.topic_id WHERE s.id=?",
        (session_id,),
    ).fetchone()
    if not row:
        conn.close()
        return {"error": "Session not found"}
    conn.execute("UPDATE study_sessions SET status='missed' WHERE id=?", (session_id,))
    conn.commit()
    conn.close()

    # Agentic behavior: the missed session immediately triggers autonomous replanning.
    result = handle_missed_session(session_id)
    return {
        "status": "missed",
        "session_id": session_id,
        "topic": row["topic_name"],
        "autonomous_replan": result,
    }


@app.post("/performance")
def performance(data: PerformanceInput):
    conn = get_connection()
    row = conn.execute("SELECT name FROM topics WHERE id=?", (data.topic_id,)).fetchone()
    if not row:
        conn.close()
        return {"error": "Topic not found"}
    score = max(0.0, min(100.0, float(data.score)))
    conn.execute(
        "INSERT INTO study_sessions(topic_id, session_date, duration, status, performance) VALUES (?, date('now'), 0, 'completed', ?)",
        (data.topic_id, score),
    )
    conn.commit()
    conn.close()

    # Agentic behavior: low performance immediately triggers adaptive replanning.
    if score < 60:
        result = handle_poor_performance(row["name"], score)
        return {
            "status": "recorded",
            "topic_id": data.topic_id,
            "topic": row["name"],
            "score": score,
            "adaptive_replan": result,
        }

    return {
        "status": "recorded",
        "topic_id": data.topic_id,
        "topic": row["name"],
        "score": score,
        "adaptive_replan": None,
    }
