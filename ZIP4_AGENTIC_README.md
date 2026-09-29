# StudyPilot — ZIP 4: Agentic Behavior

## What this checkpoint adds

ZIP 4 builds on ZIP 3 and adds the two autonomous behaviors from the roadmap:

1. **Missed session → autonomous replanning**
2. **Poor performance → adaptive replanning**

The agent now reacts to events instead of only generating a plan when the user presses the Run Agent button.

## Main changes

### Backend
- `backend/agent.py`
  - Adds missed-session handling.
  - Adds poor-performance handling.
  - Gives missed sessions extra priority during replanning.
  - Adds event-specific agent trace messages.
- `backend/tools.py`
  - Progress now includes `missed_sessions`.
- `backend/main.py`
  - `POST /sessions` creates a planned session for testing.
  - `POST /sessions/{session_id}/miss` marks a session missed and immediately triggers an autonomous replan.
  - `POST /performance` records a score and automatically triggers an adaptive replan when score is below 60.
- `backend/models.py`
  - Adds `SessionCreate` request model.

## Test flow

1. Start the backend:
   `python -m uvicorn main:app --reload`
2. Open:
   `http://127.0.0.1:8000/docs`
3. Create a planned session with `POST /sessions`.
4. Mark it missed with `POST /sessions/{session_id}/miss`.
5. Confirm the response contains `autonomous_replan` and event trace messages.
6. Test poor performance with `POST /performance` using a score below 60.
7. Confirm the response contains `adaptive_replan` and the low-performance trace.
8. Use `GET /plan` to verify the revised plan is saved.

## Important

ZIP 4 is an incremental checkpoint. Keep ZIP 3 unchanged as the stable Agent checkpoint.
