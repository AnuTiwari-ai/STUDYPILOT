from datetime import datetime
from database import get_connection


def get_student_state():
    conn = get_connection()
    row = conn.execute("SELECT * FROM students WHERE id=1").fetchone()
    conn.close()
    return dict(row) if row else None


def get_syllabus():
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM topics ORDER BY difficulty DESC, remaining_hours DESC, name"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_progress():
    conn = get_connection()
    rows = conn.execute("""
        SELECT t.id, t.subject, t.name, t.difficulty, t.estimated_hours,
               t.remaining_hours, t.status,
               COALESCE(AVG(s.performance), 0) AS avg_performance,
               COALESCE(SUM(CASE WHEN s.status='completed' THEN s.duration ELSE 0 END), 0) AS completed_hours,
               COALESCE(SUM(CASE WHEN s.status='missed' THEN 1 ELSE 0 END), 0) AS missed_sessions
        FROM topics t
        LEFT JOIN study_sessions s ON s.topic_id=t.id
        GROUP BY t.id
        ORDER BY t.difficulty DESC, t.name
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def calculate_available_time():
    student = get_student_state()
    if not student:
        return 0
    return round(float(student["daily_hours"]) * 5, 2)


def create_study_plan(plan_items, reason="Agent generated plan"):
    conn = get_connection()
    now = datetime.now().isoformat(timespec="seconds")
    cur = conn.execute(
        "INSERT INTO study_plans(version,reason,created_at) VALUES (?,?,?)",
        (1, reason, now),
    )
    plan_id = cur.lastrowid
    conn.executemany(
        "INSERT INTO study_plan_items(plan_id,day,topic,duration) VALUES (?,?,?,?)",
        [(plan_id, int(x["day"]), x["topic"], float(x["duration"])) for x in plan_items],
    )
    conn.commit()
    conn.close()
    return plan_id


def update_study_plan(plan_items, reason="Agent updated plan"):
    conn = get_connection()
    now = datetime.now().isoformat(timespec="seconds")
    latest = conn.execute("SELECT COALESCE(MAX(version), 0) AS v FROM study_plans").fetchone()["v"]
    version = int(latest) + 1
    cur = conn.execute(
        "INSERT INTO study_plans(version,reason,created_at) VALUES (?,?,?)",
        (version, reason, now),
    )
    plan_id = cur.lastrowid
    conn.executemany(
        "INSERT INTO study_plan_items(plan_id,day,topic,duration) VALUES (?,?,?,?)",
        [(plan_id, int(x["day"]), x["topic"], float(x["duration"])) for x in plan_items],
    )
    conn.commit()
    conn.close()
    return plan_id, version


def get_latest_plan():
    conn = get_connection()
    plan = conn.execute(
        "SELECT * FROM study_plans ORDER BY id DESC LIMIT 1"
    ).fetchone()
    if not plan:
        conn.close()
        return None
    items = conn.execute(
        "SELECT day,topic,duration FROM study_plan_items WHERE plan_id=? ORDER BY day,id",
        (plan["id"],),
    ).fetchall()
    conn.close()
    result = dict(plan)
    result["items"] = [dict(x) for x in items]
    return result
