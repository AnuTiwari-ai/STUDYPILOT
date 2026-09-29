# StudyPilot — ZIP 5 Final Integrated Build

StudyPilot is an agent-powered study planner built with React, FastAPI, SQLite and a deterministic agent layer.

## Final flow
Student UI → FastAPI → Agent → Agent Tools → SQLite → New/Revised Study Plan → UI

## Included capabilities
- Student state, subjects and syllabus
- Progress tracking
- Available study-time calculation
- AI-agent study-plan generation
- Agent trace/activity panel
- Autonomous replanning after a missed session
- Adaptive replanning after poor performance (score < 60)
- Study-session creation/completion/missed status
- Performance recording
- Persistent versioned study plans in SQLite
- Final React dashboard with live demo controls

## Run backend
```powershell
cd backend
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Swagger: http://127.0.0.1:8000/docs

## Run frontend
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Final demo
1. Run the agent to generate a plan.
2. Create a study session.
3. Miss the session and show the autonomous replan response + agent trace.
4. Record a low score such as 40 for a topic.
5. Show the adaptive replan and updated plan.
6. Use GET /plan or the dashboard to show the revised plan persisted in SQLite.

## Team checkpoint
ZIP 1 — Foundation: complete
ZIP 2 — Core: complete
ZIP 3 — Agent + Tools: complete
ZIP 4 — Agentic Behavior: complete after testing missed-session and poor-performance flows
ZIP 5 — Final integrated build: this package
