# StudyPilot — ZIP 3: Agent Phase

This checkpoint upgrades the Phase 2 core planner into an agent-driven study planner.

## Team split

### Person 1 — Agent Logic
Primary files:
- `backend/agent.py`
- `frontend/src/main.jsx` (only if agent UI changes are needed)

Responsibilities:
- Read student state, syllabus, progress and available time.
- Prioritise topics using difficulty, remaining work and performance.
- Generate the study plan.
- Produce an agent activity trace.

### Person 2 — Agent Tools + Integration
Primary files:
- `backend/tools.py`
- `backend/database.py`
- `backend/main.py`

Responsibilities:
- Implement/review `get_student_state()`.
- Implement/review `get_syllabus()`.
- Implement/review `get_progress()`.
- Implement/review `calculate_available_time()`.
- Implement `create_study_plan()` and `update_study_plan()`.
- Expose the agent through FastAPI.

## Run backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Open:
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

## Run frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Agent endpoints

- `POST /agent/run` — generate a plan from current state.
- `POST /agent/replan` — save a new plan version.
- `GET /agent/trace` — show agent activity.
- `GET /plan` — retrieve the latest saved plan.

## ZIP 3 scope

This phase focuses on the agent + tools. Missed-session autonomous replanning and poor-performance adaptive behavior are intentionally left for ZIP 4.

## Test checklist

1. `/health` returns `status: ok` and `phase: agent`.
2. `/student`, `/topics`, `/progress`, and `/available-time` work.
3. `POST /agent/run` returns a plan and trace.
4. `GET /plan` shows the saved plan and its items.
5. The frontend displays the Agent Study Plan and Agent Activity Trace.
6. Existing Phase 2 pages/functions do not break.
