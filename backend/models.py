from pydantic import BaseModel


class PerformanceInput(BaseModel):
    topic_id: int
    score: float


class SessionCreate(BaseModel):
    topic_id: int
    session_date: str
    duration: float


class SessionUpdate(BaseModel):
    session_id: int
    status: str
