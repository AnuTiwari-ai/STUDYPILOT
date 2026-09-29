# StudyPilot Phase 2 — Core Product

This ZIP is the next checkpoint after Phase 1 Starter.

New core features:
- Student profile
- Subjects
- Topics/syllabus
- Study sessions
- Basic study plan
- Performance recording
- Complete/miss session actions
- Subject filtering

Run backend:
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload

Run frontend in a second terminal:
cd frontend
npm install
npm run dev

Acceptance checklist:
- Dashboard opens
- Student/exam data appears
- Study plan appears
- Subject filter works
- Topics appear
- Quiz performance can be recorded
- Session actions work
- http://127.0.0.1:8000/docs opens
- npm run build succeeds

Do NOT add the AI-agent/autonomous-replanning feature yet. That is the next phase.
