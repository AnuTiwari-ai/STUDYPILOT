import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = "http://localhost:8000";

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || "Request failed");
  return data;
}

function App() {
  const [student, setStudent] = useState(null);
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [plan, setPlan] = useState([]);
  const [trace, setTrace] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [message, setMessage] = useState("Loading...");
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(40);
  const [selectedTopic, setSelectedTopic] = useState(1);
  const [selectedSession, setSelectedSession] = useState("");

  async function load() {
    try {
      const [s, t, sub, p, se, tr] = await Promise.all([
        api("/student"), api("/topics"), api("/subjects"), api("/plan"),
        api("/sessions"), api("/agent/trace")
      ]);
      setStudent(s); setTopics(t); setSubjects(sub.map(x => x.name));
      setPlan(p.latest_plan?.items || []); setSessions(se); setTrace(tr.trace || []);
      if (!selectedSession && se.length) setSelectedSession(String(se[0].id));
      setMessage("AI Agent ready");
    } catch (e) { setMessage(e.message || "Backend not running"); }
  }

  useEffect(() => { load(); }, []);

  async function runAgent() {
    setBusy(true);
    try {
      const r = await api("/agent/run", { method: "POST" });
      setPlan(r.plan || []); setTrace(r.trace || []); setMessage("Fresh plan generated"); await refreshData();
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }

  async function refreshData() {
    const [p, se, tr] = await Promise.all([api("/plan"), api("/sessions"), api("/agent/trace")]);
    setPlan(p.latest_plan?.items || []); setSessions(se); setTrace(tr.trace || []);
  }

  async function createDemoSession() {
    setBusy(true);
    try {
      const r = await api("/sessions", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: Number(selectedTopic), session_date: new Date().toISOString().slice(0,10), duration: 2 }) });
      setSelectedSession(String(r.session_id)); setMessage(`Session created for ${r.topic}`); await refreshData();
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }

  async function missSelectedSession() {
    if (!selectedSession) return setMessage("Create/select a session first");
    setBusy(true);
    try {
      const r = await api(`/sessions/${selectedSession}/miss`, { method: "POST" });
      setMessage(`Autonomous replan triggered for ${r.topic}`);
      setTrace(r.autonomous_replan?.trace || []); setPlan(r.autonomous_replan?.plan || []); await refreshData();
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }

  async function recordPerformance() {
    setBusy(true);
    try {
      const r = await api("/performance", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: Number(selectedTopic), score: Number(score) }) });
      setMessage(r.adaptive_replan ? `Adaptive replan triggered for ${r.topic}` : `Performance ${r.score}% recorded`);
      if (r.adaptive_replan) { setTrace(r.adaptive_replan.trace || []); setPlan(r.adaptive_replan.plan || []); }
      await refreshData();
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }

  const filtered = useMemo(() => selectedSubject === "All" ? topics : topics.filter(t => t.subject === selectedSubject), [topics, selectedSubject]);

  return <main className="app">
    <header className="hero">
      <div><div className="eyebrow">📚 STUDYPILOT · FINAL AGENTIC BUILD</div><h1>StudyPilot</h1><p>AI-powered planning that adapts when study sessions are missed or performance drops.</p></div>
      <div className="status">● {message}</div>
    </header>

    {student && <section className="stats">
      <div><span>Student</span><strong>{student.name}</strong></div><div><span>Exam</span><strong>{student.exam}</strong></div>
      <div><span>Exam Date</span><strong>{student.exam_date}</strong></div><div><span>Daily Hours</span><strong>{student.daily_hours} h</strong></div>
    </section>}

    <section className="card agentCard">
      <div className="cardHead"><div><h2>🤖 Agent Activity</h2><small>Student state → tools → priorities → schedule → database</small></div><button onClick={runAgent} disabled={busy}>{busy ? "Working..." : "Run Agent"}</button></div>
      <div className="trace">{trace.map((x, i) => <div key={i}>{x}</div>)}</div>
    </section>

    <section className="card demoCard">
      <div className="cardHead"><div><h2>⚡ Agentic Demo Controls</h2><small>Use these controls to demonstrate autonomous adaptation.</small></div></div>
      <div className="controls">
        <div className="control"><label>Topic</label><select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>{topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        <button onClick={createDemoSession} disabled={busy}>Create Study Session</button>
        <div className="control"><label>Session</label><select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}><option value="">Select session</option>{sessions.map(s => <option key={s.id} value={s.id}>#{s.id} · {s.topic_name} · {s.status}</option>)}</select></div>
        <button onClick={missSelectedSession} disabled={busy || !selectedSession}>Miss Session → Replan</button>
        <div className="control score"><label>Score</label><input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} /></div>
        <button onClick={recordPerformance} disabled={busy}>Record Performance</button>
      </div>
    </section>

    <div className="grid">
      <section className="card"><div className="cardHead"><div><h2>Latest Study Plan</h2><small>Current plan saved in SQLite</small></div></div>
        {plan.length ? plan.map((p, i) => <div className="planRow" key={i}><span>Day {p.day}</span><strong>{p.topic}</strong><em>{p.duration}h</em></div>) : <p className="muted">Run the agent to create a plan.</p>}
      </section>
      <section className="card"><div className="cardHead"><div><h2>Syllabus</h2><small>Topics used by the agent</small></div><select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}><option>All</option>{subjects.map(s => <option key={s}>{s}</option>)}</select></div>
        {filtered.map(t => <div className="row" key={t.id}><div><strong>{t.name}</strong><small>{t.subject} · Difficulty {t.difficulty} · {t.remaining_hours}h remaining</small></div></div>)}
      </section>
    </div>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
