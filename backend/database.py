import sqlite3
import os
from pathlib import Path

DB_PATH = Path(os.getenv("DB_PATH", Path(__file__).parent / "studypilot.db"))
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        exam TEXT NOT NULL,
        exam_date TEXT NOT NULL,
        daily_hours REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY,
        student_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY(student_id) REFERENCES students(id)
    );
    CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY,
        subject TEXT NOT NULL,
        name TEXT NOT NULL,
        difficulty INTEGER NOT NULL,
        estimated_hours REAL NOT NULL,
        remaining_hours REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS study_sessions (
        id INTEGER PRIMARY KEY,
        topic_id INTEGER NOT NULL,
        session_date TEXT NOT NULL,
        duration REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'planned',
        performance REAL,
        FOREIGN KEY(topic_id) REFERENCES topics(id)
    );
    CREATE TABLE IF NOT EXISTS study_plans (
        id INTEGER PRIMARY KEY,
        version INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS study_plan_items (
        id INTEGER PRIMARY KEY,
        plan_id INTEGER NOT NULL,
        day INTEGER NOT NULL,
        topic TEXT NOT NULL,
        duration REAL NOT NULL,
        FOREIGN KEY(plan_id) REFERENCES study_plans(id)
    );
    """)

    if cur.execute("SELECT COUNT(*) FROM students").fetchone()[0] == 0:
        cur.execute(
            "INSERT INTO students VALUES (1, ?, ?, ?, ?)",
            ("Rahul", "Mathematics", "2026-10-05", 4),
        )

    for subject in ["Mathematics", "Physics"]:
        if cur.execute("SELECT COUNT(*) FROM subjects WHERE name=?", (subject,)).fetchone()[0] == 0:
            cur.execute("INSERT INTO subjects(student_id,name) VALUES (1,?)", (subject,))

    if cur.execute("SELECT COUNT(*) FROM topics").fetchone()[0] == 0:
        cur.executemany(
            """INSERT INTO topics(subject,name,difficulty,estimated_hours,remaining_hours,status)
               VALUES (?,?,?,?,?,?)""",
            [
                ("Mathematics", "Integration", 5, 4, 4, "pending"),
                ("Mathematics", "Probability", 4, 3, 3, "pending"),
                ("Mathematics", "Matrices", 3, 2, 2, "pending"),
                ("Mathematics", "Differentiation", 3, 2, 2, "pending"),
                ("Physics", "Mechanics", 4, 3, 3, "pending"),
                ("Physics", "Electrostatics", 3, 2, 2, "pending"),
            ],
        )

    conn.commit()
    conn.close()