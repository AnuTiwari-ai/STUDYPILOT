import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
  const [activeNav, setActiveNav] = useState("Dashboard");

  async function load() {
    try {
      const [s, t, sub, p, se, tr] = await Promise.all([
        api("/student"), api("/topics"), api("/subjects"),
        api("/plan"), api("/sessions"), api("/agent/trace")
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
      const r = await api("/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: Number(selectedTopic), session_date: new Date().toISOString().slice(0, 10), duration: 2 })
      });
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
      const r = await api("/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: Number(selectedTopic), score: Number(score) })
      });
      setMessage(r.adaptive_replan ? `Adaptive replan triggered for ${r.topic}` : `Performance ${r.score}% recorded`);
      if (r.adaptive_replan) { setTrace(r.adaptive_replan.trace || []); setPlan(r.adaptive_replan.plan || []); }
      await refreshData();
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }

  const filtered = useMemo(() => (
    selectedSubject === "All" ? topics : topics.filter(t => t.subject === selectedSubject)
  ), [topics, selectedSubject]);

  const totalPlannedHours = useMemo(() => plan.reduce((sum, item) => sum + (item.duration || 0), 0), [plan]);

  return (
    <div className="portal-layout">
      {/* FIXED DARK NAVY SIDEBAR */}
      <aside className="portal-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">📚</span>
          <span className="brand-title">StudyPilot</span>
        </div>

        <div className="sidebar-menu">
          <div className="menu-group">
            <span className="group-label">OVERVIEW</span>
            <button
              className={`menu-item ${activeNav === "Dashboard" ? "active" : ""}`}
              onClick={() => setActiveNav("Dashboard")}
            >
              <span className="menu-icon">📊</span>
              <span>Dashboard</span>
            </button>
          </div>

          <div className="menu-group">
            <span className="group-label">STUDY</span>
            <button
              className={`menu-item ${activeNav === "Syllabus" ? "active" : ""}`}
              onClick={() => setActiveNav("Syllabus")}
            >
              <span className="menu-icon">📚</span>
              <span>Syllabus</span>
            </button>
            <button
              className={`menu-item ${activeNav === "Study Plan" ? "active" : ""}`}
              onClick={() => setActiveNav("Study Plan")}
            >
              <span className="menu-icon">📅</span>
              <span>Study Plan</span>
            </button>
            <button
              className={`menu-item ${activeNav === "Study Sessions" ? "active" : ""}`}
              onClick={() => setActiveNav("Study Sessions")}
            >
              <span className="menu-icon">⏱</span>
              <span>Study Sessions</span>
            </button>
          </div>

          <div className="menu-group">
            <span className="group-label">PROGRESS</span>
            <button
              className={`menu-item ${activeNav === "Progress" ? "active" : ""}`}
              onClick={() => setActiveNav("Progress")}
            >
              <span className="menu-icon">📈</span>
              <span>Progress</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="portal-main">
        {/* TOP HEADER */}
        <header className="portal-header">
          <div className="header-greeting">
            <h1>Welcome back, {student ? student.name : "Rahul"} 👋</h1>
            <p>Let's make today's study time count.</p>
          </div>

          <div className="header-right">
            <div className="status-pill">
              <span className="status-dot"></span>
              <span className="status-text">{message}</span>
            </div>
            <div className="avatar-circle">
              <span>{student ? student.name.charAt(0) : "R"}</span>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT CONTAINER */}
        <main className="portal-content">
          {/* WELCOME / HERO CARD */}
          <section className="welcome-card">
            <div className="welcome-left">
              <div className="welcome-eyebrow">
                <span>📚 SMART STUDY PLANNER</span>
              </div>
              <h2 className="welcome-title">StudyPilot</h2>
              <p className="welcome-tagline">
                "Plan smarter. Stay consistent. Adapt your study schedule."
              </p>
            </div>
            <div className="welcome-right">
              <div className="illustration-wrapper">
                <img src="/study_hero.jpg" alt="Study Desk" className="illustration-img" />
              </div>
            </div>
          </section>

          {/* STUDENT OVERVIEW CARDS */}
          {student && (
            <section className="overview-grid">
              <div className="overview-card card-blue">
                <div className="card-header">
                  <span className="card-icon">👤</span>
                  <span className="card-label">STUDENT</span>
                </div>
                <strong className="card-value">{student.name}</strong>
                <span className="card-subtext">Your profile</span>
                <div className="accent-bar bar-blue"></div>
              </div>

              <div className="overview-card card-purple">
                <div className="card-header">
                  <span className="card-icon">📚</span>
                  <span className="card-label">EXAM</span>
                </div>
                <strong className="card-value">{student.exam}</strong>
                <span className="card-subtext">Target exam</span>
                <div className="accent-bar bar-purple"></div>
              </div>

              <div className="overview-card card-pink">
                <div className="card-header">
                  <span className="card-icon">📅</span>
                  <span className="card-label">EXAM DATE</span>
                </div>
                <strong className="card-value">{student.exam_date}</strong>
                <span className="card-subtext">Upcoming</span>
                <div className="accent-bar bar-pink"></div>
              </div>

              <div className="overview-card card-teal">
                <div className="card-header">
                  <span className="card-icon">⏱</span>
                  <span className="card-label">DAILY HOURS</span>
                </div>
                <strong className="card-value">{student.daily_hours} hours</strong>
                <span className="card-subtext">Daily goal</span>
                <div className="accent-bar bar-teal"></div>
              </div>
            </section>
          )}

          {/* REAL PROGRESS PANEL */}
          <section className="portal-card progress-panel">
            <div className="card-title-row">
              <div>
                <h3>📈 Study Progress Overview</h3>
                <small className="section-subtitle">Real-time overview of your curriculum and schedule</small>
              </div>
            </div>
            <div className="progress-boxes">
              <div className="p-box">
                <span className="p-icon">📖</span>
                <div>
                  <strong className="p-val">{topics.length}</strong>
                  <span className="p-lbl">Total Curriculum Topics</span>
                </div>
              </div>
              <div className="p-box">
                <span className="p-icon">⌛</span>
                <div>
                  <strong className="p-val">{totalPlannedHours} hrs</strong>
                  <span className="p-lbl">Planned Study Time</span>
                </div>
              </div>
              <div className="p-box">
                <span className="p-icon">📑</span>
                <div>
                  <strong className="p-val">{sessions.length}</strong>
                  <span className="p-lbl">Scheduled Sessions</span>
                </div>
              </div>
            </div>
          </section>

          {/* MIDDLE GRID: ACTIVITY & ADAPTATION */}
          <div className="portal-middle-grid">
            {/* STUDY PLANNING ACTIVITY */}
            <section className="portal-card activity-card">
              <div className="card-title-row">
                <div>
                  <h3>📊 Study Planning Activity</h3>
                  <small className="section-subtitle">See how your study plan is created.</small>
                </div>
                <button className="btn-run-agent" onClick={runAgent} disabled={busy}>
                  {busy ? "Working..." : "Run Agent"}
                </button>
              </div>

              <div className="timeline-box">
                {trace.length > 0 ? (
                  <div className="timeline-list">
                    {trace.map((step, idx) => (
                      <div key={idx} className="timeline-node">
                        <div className="node-marker">
                          <span className="check-icon">✓</span>
                          {idx < trace.length - 1 && <span className="node-line"></span>}
                        </div>
                        <span className="node-text">{step}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="timeline-empty">
                    <span>✨ Click "Run Agent" to simulate autonomous study planning.</span>
                  </div>
                )}
              </div>
            </section>

            {/* SMART ADAPTATION */}
            <section className="portal-card adaptation-card">
              <div className="card-title-row">
                <div>
                  <h3>⚡ Smart Adaptation</h3>
                  <small className="section-subtitle">Your study plan adjusts when your schedule or performance changes.</small>
                </div>
              </div>

              {/* WORKFLOW CARDS */}
              <div className="workflow-grid">
                <div className="flow-card flow-missed">
                  <span className="flow-header">MISSED SESSION</span>
                  <div className="flow-items">
                    <span className="flow-badge">📅 Create Study Session</span>
                    <span className="flow-down">↓</span>
                    <span className="flow-badge badge-warning">⚠️ Missed Session</span>
                    <span className="flow-down">↓</span>
                    <span className="flow-badge badge-success">🔄 Plan Updated</span>
                  </div>
                </div>

                <div className="flow-card flow-performance">
                  <span className="flow-header">PERFORMANCE</span>
                  <div className="flow-items">
                    <span className="flow-badge">📝 Record Performance</span>
                    <span className="flow-down">↓</span>
                    <span className="flow-badge badge-info">📉 Low Score</span>
                    <span className="flow-down">↓</span>
                    <span className="flow-badge badge-success">🔄 Plan Adapted</span>
                  </div>
                </div>
              </div>

              {/* CONTROLS */}
              <div className="adaptation-controls">
                <div className="control-block">
                  <span className="block-label">Session Adaptation</span>
                  <div className="ctrl-row">
                    <div className="field">
                      <label>Topic</label>
                      <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                        {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <button className="btn-secondary" onClick={createDemoSession} disabled={busy}>
                      Create Study Session
                    </button>
                  </div>

                  <div className="ctrl-row">
                    <div className="field">
                      <label>Active Session</label>
                      <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                        <option value="">Select session</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>#{s.id} · {s.topic_name} · {s.status}</option>)}
                      </select>
                    </div>
                    <button className="btn-miss" onClick={missSelectedSession} disabled={busy || !selectedSession}>
                      Miss Session → Replan
                    </button>
                  </div>
                </div>

                <div className="control-block">
                  <span className="block-label">Performance Adaptation</span>
                  <div className="ctrl-row">
                    <div className="field">
                      <label>Score (0 - 100)</label>
                      <input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} />
                    </div>
                    <button className="btn-teal" onClick={recordPerformance} disabled={busy}>
                      Record Performance
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* BOTTOM GRID: LATEST PLAN & SYLLABUS */}
          <div className="portal-bottom-grid">
            {/* LATEST STUDY PLAN */}
            <section className="portal-card plan-section">
              <div className="card-title-row">
                <div>
                  <h3>📅 Latest Study Plan</h3>
                  <small className="section-subtitle">Your personalised study schedule</small>
                </div>
              </div>

              <div className="schedule-list">
                {plan.length ? plan.map((p, i) => (
                  <div className={`schedule-item schedule-color-${(i % 4) + 1}`} key={i}>
                    <span className="day-pill">DAY {p.day}</span>
                    <div className="schedule-details">
                      <strong className="topic-title">{p.topic}</strong>
                      <span className="subject-name">Mathematics</span>
                    </div>
                    <span className="duration-tag">🕒 {p.duration} {p.duration === 1 ? "hour" : "hours"}</span>
                  </div>
                )) : (
                  <div className="empty-box">
                    <span>📌 Run the agent to generate your custom study schedule.</span>
                  </div>
                )}
              </div>
            </section>

            {/* SYLLABUS */}
            <section className="portal-card syllabus-section">
              <div className="card-title-row">
                <div>
                  <h3>📚 Syllabus</h3>
                  <small className="section-subtitle">Topics used by the agent</small>
                </div>
                <div className="filter-box">
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                    <option>All</option>
                    {subjects.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="syllabus-list">
                {filtered.map(t => (
                  <div className="syllabus-card" key={t.id}>
                    <div className="syl-header">
                      <strong className="syl-title">{t.name}</strong>
                      <span className="syl-subject">{t.subject}</span>
                    </div>
                    <div className="syl-meta">
                      <div className="diff-box">
                        <span className="diff-label">Difficulty:</span>
                        <div className="dots-row">
                          {[1, 2, 3, 4, 5].map(d => (
                            <span key={d} className={`dot ${d <= t.difficulty ? "filled" : ""}`} />
                          ))}
                        </div>
                      </div>
                      <span className="remaining-hrs">{t.remaining_hours} hrs remaining</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);


