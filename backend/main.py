from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_connection
from tools import (
    get_student_state,
    get_syllabus,
    get_progress,
    calculate_available_time,
    get_latest_plan,
)
from agent import (
    create_basic_plan,
    run_agent,
    handle_missed_session,
    handle_poor_performance,
)
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


# ============================================================
# BASIC
# ============================================================

@app.get("/")
def root():
    return {
        "message": "StudyPilot Backend Running - Final Integrated Build"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "phase": "agentic"
    }


# ============================================================
# STUDENT PROFILE
# ============================================================

@app.get("/student")
def student():
    return get_student_state()


@app.post("/setup")
def setup_student(data: dict = Body(...)):
    """
    Create/update the student's complete study profile.

    Expected:
    {
        "name": "Anu",
        "exam": "JEE 2026",
        "exam_date": "2026-10-15",
        "daily_hours": 4,
        "subjects": ["Mathematics", "Physics"],
        "tasks": [
            {
                "subject": "Mathematics",
                "name": "Integration",
                "difficulty": 5,
                "estimated_hours": 4
            }
        ]
    }
    """

    name = str(data.get("name", "")).strip()
    exam = str(data.get("exam", "")).strip()
    exam_date = str(data.get("exam_date", "")).strip()

    try:
        daily_hours = float(data.get("daily_hours", 0))
    except (TypeError, ValueError):
        return {"error": "Daily study hours must be a number"}

    subjects_data = data.get("subjects", [])
    tasks = data.get("tasks", [])

    if not name:
        return {"error": "Student name is required"}

    if not exam:
        return {"error": "Exam or study goal is required"}

    if not exam_date:
        return {"error": "Exam date is required"}

    if daily_hours <= 0:
        return {"error": "Daily study hours must be greater than 0"}

    if not isinstance(tasks, list) or len(tasks) == 0:
        return {"error": "Add at least one study task"}

    conn = get_connection()

    # --------------------------------------------------------
    # Update student profile
    # --------------------------------------------------------

    conn.execute(
        """
        UPDATE students
        SET name=?, exam=?, exam_date=?, daily_hours=?
        WHERE id=1
        """,
        (
            name,
            exam,
            exam_date,
            daily_hours,
        ),
    )

    # --------------------------------------------------------
    # Clear previous demo state
    # --------------------------------------------------------

    conn.execute("DELETE FROM study_sessions")
    conn.execute("DELETE FROM study_plan_items")
    conn.execute("DELETE FROM study_plans")
    conn.execute("DELETE FROM subjects")
    conn.execute("DELETE FROM topics")

    # --------------------------------------------------------
    # Collect subjects
    # --------------------------------------------------------

    unique_subjects = []

    if isinstance(subjects_data, list):
        for subject in subjects_data:
            subject_name = str(subject).strip()

            if subject_name and subject_name not in unique_subjects:
                unique_subjects.append(subject_name)

    # Also automatically collect subjects from tasks.
    for task in tasks:
        if not isinstance(task, dict):
            continue

        subject_name = str(task.get("subject", "")).strip()

        if subject_name and subject_name not in unique_subjects:
            unique_subjects.append(subject_name)

    # --------------------------------------------------------
    # Save subjects
    # --------------------------------------------------------

    for subject_name in unique_subjects:
        conn.execute(
            """
            INSERT INTO subjects(student_id, name)
            VALUES (1, ?)
            """,
            (subject_name,),
        )

    # --------------------------------------------------------
    # Save tasks
    # --------------------------------------------------------

    saved_tasks = []

    for task in tasks:
        if not isinstance(task, dict):
            continue

        subject_name = str(task.get("subject", "")).strip()
        task_name = str(task.get("name", "")).strip()

        if not subject_name or not task_name:
            continue

        try:
            difficulty = int(task.get("difficulty", 3))
        except (TypeError, ValueError):
            difficulty = 3

        difficulty = max(1, min(5, difficulty))

        try:
            estimated_hours = float(task.get("estimated_hours", 2))
        except (TypeError, ValueError):
            estimated_hours = 2

        estimated_hours = max(0.5, estimated_hours)

        conn.execute(
            """
            INSERT INTO topics(
                subject,
                name,
                difficulty,
                estimated_hours,
                remaining_hours,
                status
            )
            VALUES (?, ?, ?, ?, ?, 'pending')
            """,
            (
                subject_name,
                task_name,
                difficulty,
                estimated_hours,
                estimated_hours,
            ),
        )

        saved_tasks.append(
            {
                "subject": subject_name,
                "name": task_name,
                "difficulty": difficulty,
                "estimated_hours": estimated_hours,
            }
        )

    if not saved_tasks:
        conn.rollback()
        conn.close()
        return {"error": "No valid study tasks were provided"}

    conn.commit()
    conn.close()

    return {
        "status": "created",
        "student": {
            "name": name,
            "exam": exam,
            "exam_date": exam_date,
            "daily_hours": daily_hours,
        },
        "subjects": unique_subjects,
        "tasks": saved_tasks,
        "task_count": len(saved_tasks),
        "message": (
            f"Study profile created for {name} "
            f"with {len(saved_tasks)} study tasks."
        ),
    }


# ============================================================
# SUBJECTS
# ============================================================

@app.get("/subjects")
def subjects():
    conn = get_connection()

    rows = conn.execute(
        """
        SELECT DISTINCT subject
        FROM topics
        ORDER BY subject
        """
    ).fetchall()

    conn.close()

    return [
        {"name": row["subject"]}
        for row in rows
    ]


# ============================================================
# TOPICS / TASKS
# ============================================================
@app.get("/topics")
def topics(subject: str | None = None):
    conn = get_connection()

    if subject:
        rows = conn.execute(
            """
            SELECT *
            FROM topics
            WHERE subject=?
            ORDER BY difficulty DESC, remaining_hours DESC, name
            """,
            (subject,),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT *
            FROM topics
            ORDER BY difficulty DESC, remaining_hours DESC, name
            """
        ).fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]


@app.post("/topics")
def add_topic(payload: dict):
    subject = str(payload.get("subject", "")).strip()
    name = str(payload.get("name", "")).strip()
    difficulty = int(payload.get("difficulty", 3))
    estimated_hours = float(payload.get("estimated_hours", 2))

    if not subject:
        raise HTTPException(
            status_code=400,
            detail="Subject is required"
        )

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Topic name is required"
        )

    if difficulty < 1 or difficulty > 5:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be between 1 and 5"
        )

    if estimated_hours <= 0:
        raise HTTPException(
            status_code=400,
            detail="Estimated hours must be greater than 0"
        )

    conn = get_connection()

    existing_subject = conn.execute(
        """
        SELECT id
        FROM subjects
        WHERE student_id=1 AND name=?
        """,
        (subject,)
    ).fetchone()

    if not existing_subject:
        conn.execute(
            """
            INSERT INTO subjects(student_id, name)
            VALUES (?, ?)
            """,
            (1, subject)
        )

    cur = conn.execute(
        """
        INSERT INTO topics(
            subject,
            name,
            difficulty,
            estimated_hours,
            remaining_hours,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            subject,
            name,
            difficulty,
            estimated_hours,
            estimated_hours,
            "pending",
        )
    )

    topic_id = cur.lastrowid

    conn.commit()
    conn.close()

    return {
        "status": "created",
        "topic_id": topic_id,
        "subject": subject,
        "topic": name,
        "difficulty": difficulty,
        "estimated_hours": estimated_hours,
        "remaining_hours": estimated_hours,
    }


# ============================================================
# PROGRESS
# ============================================================

@app.get("/progress")
def progress():
    return get_progress()


@app.post("/progress")
def update_progress(data: dict = Body(...)):
    """
    Save actual student completion percentage.

    Example:
    {
        "topic_id": 1,
        "completion": 75
    }
    """

    try:
        topic_id = int(data.get("topic_id"))
    except (TypeError, ValueError):
        return {"error": "Valid topic_id is required"}

    try:
        completion = float(data.get("completion", 0))
    except (TypeError, ValueError):
        return {"error": "Completion must be a number"}

    completion = max(0.0, min(100.0, completion))

    conn = get_connection()

    topic = conn.execute(
        """
        SELECT id, name, estimated_hours
        FROM topics
        WHERE id=?
        """,
        (topic_id,),
    ).fetchone()

    if not topic:
        conn.close()
        return {"error": "Topic not found"}

    estimated_hours = float(topic["estimated_hours"])

    remaining_hours = round(
        estimated_hours * (1 - completion / 100),
        2,
    )

    status = (
        "completed"
        if completion >= 100
        else "pending"
    )

    conn.execute(
        """
        UPDATE topics
        SET remaining_hours=?, status=?
        WHERE id=?
        """,
        (
            remaining_hours,
            status,
            topic_id,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "status": "updated",
        "topic_id": topic_id,
        "topic": topic["name"],
        "completion": completion,
        "remaining_hours": remaining_hours,
        "message": (
            f"{topic['name']} is {completion:g}% complete. "
            f"{remaining_hours:g}h remaining."
        ),
    }
# ============================================================
# AVAILABLE STUDY TIME
# ============================================================

@app.get("/available-time")
def available_time():
    student = get_student_state()

    if not student:
        return {
            "daily_hours": 0,
            "five_day_hours": 0,
        }

    return {
        "daily_hours": float(student["daily_hours"]),
        "five_day_hours": calculate_available_time(),
    }


# ============================================================
# SESSIONS
# ============================================================

@app.get("/sessions")
def sessions():
    conn = get_connection()

    rows = conn.execute(
        """
        SELECT
            s.*,
            t.name AS topic_name
        FROM study_sessions s
        JOIN topics t ON t.id=s.topic_id
        ORDER BY s.session_date, s.id
        """
    ).fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]


@app.post("/sessions")
def create_session(data: SessionCreate):
    conn = get_connection()

    topic = conn.execute(
        """
        SELECT id, name
        FROM topics
        WHERE id=?
        """,
        (data.topic_id,),
    ).fetchone()

    if not topic:
        conn.close()
        return {"error": "Topic not found"}

    cur = conn.execute(
        """
        INSERT INTO study_sessions(
            topic_id,
            session_date,
            duration,
            status,
            performance
        )
        VALUES (?, ?, ?, 'planned', NULL)
        """,
        (
            data.topic_id,
            data.session_date,
            data.duration,
        ),
    )

    conn.commit()

    session_id = cur.lastrowid

    conn.close()

    return {
        "status": "created",
        "session_id": session_id,
        "topic": topic["name"],
    }


# ============================================================
# STUDY PLAN
# ============================================================

@app.get("/plan")
def plan():
    return {
        "latest_plan": get_latest_plan()
    }


@app.post("/plan/create")
def create_plan():
    return run_agent(
        "Initial AI agent study plan",
        update=False,
    )


@app.post("/agent/run")
def agent_run():
    return run_agent(
        "AI agent generated plan",
        update=False,
    )


@app.post("/agent/replan")
def agent_replan():
    return run_agent(
        "AI agent updated the study plan",
        update=True,
    )


# ============================================================
# DYNAMIC AGENT TRACE
# ============================================================

@app.get("/agent/trace")
def agent_trace():
    """
    Returns dynamic information from the actual database state.
    This replaces the old hard-coded generic trace.
    """

    student = get_student_state()
    syllabus = get_syllabus()
    progress_data = get_progress()
    available = calculate_available_time()
    latest = get_latest_plan()

    if not student:
        return {
            "trace": [
                "No student profile has been created yet."
            ]
        }

    trace = [
        (
            f"✓ Retrieved student state: "
            f"{student['name']} · {student['exam']}"
        ),
        (
            f"  Exam date: {student['exam_date']} · "
            f"Daily capacity: {float(student['daily_hours']):g}h"
        ),
        (
            f"✓ Checked syllabus: "
            f"{len(syllabus)} study tasks"
        ),
        (
            f"✓ Reviewed progress: "
            f"{len(progress_data)} topics"
        ),
    ]

    # Show real progress for each topic.
    for item in progress_data:
        estimated = float(item["estimated_hours"] or 0)
        remaining = float(item["remaining_hours"] or 0)

        if estimated > 0:
            completion = max(
                0,
                min(
                    100,
                    round(
                        (1 - remaining / estimated) * 100,
                        1,
                    ),
                ),
            )
        else:
            completion = 100 if remaining <= 0 else 0

        trace.append(
            f"  {item['name']}: "
            f"{completion:g}% complete · "
            f"{remaining:g}h remaining · "
            f"avg score {float(item['avg_performance'] or 0):g}%"
        )

    trace.append(
        f"✓ Calculated available study time: "
        f"{available:g}h over 5 days"
    )

    # Display actual priority order.
    try:
        from agent import _priority

        progress_by_name = {
            item["name"]: item
            for item in progress_data
        }

        prioritized = sorted(
            syllabus,
            key=lambda topic: _priority(
                topic,
                progress_by_name,
            ),
            reverse=True,
        )

        trace.append(
            f"✓ Prioritised {len(prioritized)} topics "
            f"using difficulty, remaining work, performance and missed sessions"
        )

        if prioritized:
            top_topics = prioritized[:3]

            for index, topic in enumerate(
                top_topics,
                start=1,
            ):
                p = progress_by_name.get(
                    topic["name"],
                    {},
                )

                trace.append(
                    f"  Priority {index}: "
                    f"{topic['name']} · "
                    f"{float(topic['remaining_hours']):g}h remaining · "
                    f"difficulty {topic['difficulty']}/5 · "
                    f"avg score {float(p.get('avg_performance') or 0):g}%"
                )

    except Exception:
        trace.append(
            "✓ Prioritised topics using current study state"
        )

    if latest:
        trace.append(
            f"✓ Loaded Plan v{latest['version']}"
        )

        trace.append(
            f"  {len(latest['items'])} scheduled study blocks"
        )
    else:
        trace.append(
            "○ No study plan generated yet"
        )

    return {
        "trace": trace
    }


# ============================================================
# COMPLETE SESSION
# ============================================================

@app.post("/sessions/{session_id}/complete")
def complete_session(session_id: int):
    conn = get_connection()

    row = conn.execute(
        """
        SELECT *
        FROM study_sessions
        WHERE id=?
        """,
        (session_id,),
    ).fetchone()

    if not row:
        conn.close()
        return {
            "error": "Session not found"
        }

    conn.execute(
        """
        UPDATE study_sessions
        SET status='completed'
        WHERE id=?
        """,
        (session_id,),
    )

    conn.commit()
    conn.close()

    return {
        "status": "completed",
        "session_id": session_id,
    }


# ============================================================
# MISSED SESSION → AUTONOMOUS REPLAN
# ============================================================

@app.post("/sessions/{session_id}/miss")
def miss_session(session_id: int):
    conn = get_connection()

    row = conn.execute(
        """
        SELECT
            s.*,
            t.name AS topic_name
        FROM study_sessions s
        JOIN topics t ON t.id=s.topic_id
        WHERE s.id=?
        """,
        (session_id,),
    ).fetchone()

    if not row:
        conn.close()
        return {
            "error": "Session not found"
        }

    conn.execute(
        """
        UPDATE study_sessions
        SET status='missed'
        WHERE id=?
        """,
        (session_id,),
    )

    conn.commit()
    conn.close()

    result = handle_missed_session(session_id)

    return {
        "status": "missed",
        "session_id": session_id,
        "topic": row["topic_name"],
        "autonomous_replan": result,
    }


# ============================================================
# PERFORMANCE → ADAPTIVE REPLAN
# ============================================================

@app.post("/performance")
def performance(data: PerformanceInput):
    conn = get_connection()

    row = conn.execute(
        """
        SELECT name
        FROM topics
        WHERE id=?
        """,
        (data.topic_id,),
    ).fetchone()

    if not row:
        conn.close()
        return {
            "error": "Topic not found"
        }

    score = max(
        0.0,
        min(
            100.0,
            float(data.score),
        ),
    )

    conn.execute(
        """
        INSERT INTO study_sessions(
            topic_id,
            session_date,
            duration,
            status,
            performance
        )
        VALUES (
            ?,
            date('now'),
            0,
            'completed',
            ?
        )
        """,
        (
            data.topic_id,
            score,
        ),
    )

    conn.commit()
    conn.close()

    if score < 60:
        result = handle_poor_performance(
            row["name"],
            score,
        )

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