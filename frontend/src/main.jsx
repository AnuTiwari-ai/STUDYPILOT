import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import {
  DashboardIcon,
  BookIcon,
  CalendarIcon,
  ClockIcon,
  ChartIcon,
  UserIcon,
  TargetIcon,
  CheckCircleIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  AlertTriangleIcon,
  PlayIcon,
  RefreshCwIcon,
  GraduationCapIcon,
  BellIcon,
  LogOutIcon,
  ChevronRightIcon,
  SlidersIcon,
  ZapIcon,
  ArrowRightIcon,
  FilterIcon
} from "./Icons";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || data.error || "Request failed");
  }

  return data;
}

function Setup({ onComplete }) {
  const [name, setName] = useState("");
  const [exam, setExam] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(4);

  const [subjects, setSubjects] = useState([""]);
  const [tasks, setTasks] = useState([
    {
      subject: "",
      name: "",
      difficulty: 3,
      estimated_hours: 2,
    },
  ]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function updateSubject(index, value) {
    setSubjects((current) =>
      current.map((item, i) => (i === index ? value : item))
    );
  }

  function addSubject() {
    setSubjects((current) => [...current, ""]);
  }

  function removeSubject(index) {
    setSubjects((current) =>
      current.length === 1
        ? current
        : current.filter((_, i) => i !== index)
    );
  }

  function updateTask(index, field, value) {
    setTasks((current) =>
      current.map((task, i) =>
        i === index
          ? {
              ...task,
              [field]:
                field === "difficulty" || field === "estimated_hours"
                  ? Number(value)
                  : value,
            }
          : task
      )
    );
  }

  function addTask() {
    setTasks((current) => [
      ...current,
      {
        subject: "",
        name: "",
        difficulty: 3,
        estimated_hours: 2,
      },
    ]);
  }

  function removeTask(index) {
    setTasks((current) =>
      current.length === 1
        ? current
        : current.filter((_, i) => i !== index)
    );
  }

  async function createProfile() {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!exam.trim()) {
      setError("Please enter your exam or study goal.");
      return;
    }

    if (!examDate) {
      setError("Please select your exam date.");
      return;
    }

    if (Number(dailyHours) <= 0) {
      setError("Daily study hours must be greater than 0.");
      return;
    }

    const validTasks = tasks.filter(
      (task) => task.subject.trim() && task.name.trim()
    );

    if (!validTasks.length) {
      setError("Please add at least one study task.");
      return;
    }

    setBusy(true);

    try {
      const result = await api("/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          exam: exam.trim(),
          exam_date: examDate,
          daily_hours: Number(dailyHours),
          subjects: subjects
            .map((subject) => subject.trim())
            .filter(Boolean),
          tasks: validTasks,
        }),
      });

      onComplete(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <div className="setup-logo-badge">
            <GraduationCapIcon size={30} />
          </div>
          <h1 className="setup-title">Welcome to StudyPilot</h1>
          <p className="setup-subtitle">
            Configure your student study profile. Our AI agent will calculate an optimized, adaptive study plan tailored to your exam target.
          </p>
        </div>

        <div className="controls-grid">
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Alex Student"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Exam / Target Goal</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. JEE Main 2026"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Exam Date</label>
            <input
              type="date"
              className="form-control"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Daily Study Hours</label>
            <input
              type="number"
              className="form-control"
              min="0.5"
              max="24"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ boxShadow: "none", backgroundColor: "#F8FAFC" }}>
          <div className="card-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
            <div className="card-header-info">
              <h3 className="card-title">
                <BookIcon size={18} /> Subjects
              </h3>
              <p className="card-subtitle">List the core subjects in your curriculum</p>
            </div>
            <button type="button" className="btn-secondary" onClick={addSubject}>
              <PlusIcon size={16} /> Add Subject
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            {subjects.map((subject, index) => (
              <div key={index} style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mathematics"
                  value={subject}
                  onChange={(e) => updateSubject(index, e.target.value)}
                />
                {subjects.length > 1 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => removeSubject(index)}
                    style={{ color: "#EF4444" }}
                  >
                    <TrashIcon size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ boxShadow: "none", backgroundColor: "#F8FAFC" }}>
          <div className="card-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
            <div className="card-header-info">
              <h3 className="card-title">
                <SlidersIcon size={18} /> Initial Tasks & Syllabus Chapters
              </h3>
              <p className="card-subtitle">Define chapters and estimated study effort</p>
            </div>
            <button type="button" className="btn-secondary" onClick={addTask}>
              <PlusIcon size={16} /> Add Task
            </button>
          </div>

          <div style={{ marginTop: "12px" }}>
            {tasks.map((task, index) => (
              <div className="task-editor-row" key={index}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Subject"
                  value={task.subject}
                  onChange={(e) => updateTask(index, "subject", e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Topic / Chapter Name"
                  value={task.name}
                  onChange={(e) => updateTask(index, "name", e.target.value)}
                />
                <select
                  className="form-control"
                  value={task.difficulty}
                  onChange={(e) => updateTask(index, "difficulty", e.target.value)}
                >
                  <option value="1">Diff 1</option>
                  <option value="2">Diff 2</option>
                  <option value="3">Diff 3</option>
                  <option value="4">Diff 4</option>
                  <option value="5">Diff 5</option>
                </select>
                <input
                  type="number"
                  className="form-control"
                  min="0.5"
                  step="0.5"
                  placeholder="Hours"
                  value={task.estimated_hours}
                  onChange={(e) => updateTask(index, "estimated_hours", e.target.value)}
                />
                {tasks.length > 1 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => removeTask(index)}
                    style={{ color: "#EF4444" }}
                  >
                    <TrashIcon size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <button
          className="btn-primary"
          onClick={createProfile}
          disabled={busy}
          style={{ width: "100%", justifyContent: "center", height: "48px", fontSize: "16px" }}
        >
          {busy ? "Creating Study Profile..." : "Create Study Profile"}
          <ArrowRightIcon size={18} />
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
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
  const [completion, setCompletion] = useState(0);

  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({
    subject: "",
    name: "",
    difficulty: 3,
    estimated_hours: 2,
  });

  async function load() {
    try {
      const [s, t, sub, p, se, tr] = await Promise.all([
        api("/student"),
        api("/topics"),
        api("/subjects"),
        api("/plan"),
        api("/sessions"),
        api("/agent/trace"),
      ]);

      setStudent(s);
      setTopics(t);
      setSubjects(sub.map((x) => x.name));
      setPlan(p.latest_plan?.items || []);
      setSessions(se);
      setTrace(tr.trace || []);

      if (!selectedTopic && t.length) {
        setSelectedTopic(String(t[0].id));
      }

      if (!selectedSession && se.length) {
        setSelectedSession(String(se[0].id));
      }

      setMessage("AI Agent ready");
    } catch (e) {
      setMessage(e.message || "Backend not running");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const topic = topics.find(
      (t) => String(t.id) === String(selectedTopic)
    );

    if (topic && Number(topic.estimated_hours) > 0) {
      const savedCompletion =
        ((Number(topic.estimated_hours) -
          Number(topic.remaining_hours)) /
          Number(topic.estimated_hours)) *
        100;

      setCompletion(
        Math.max(0, Math.min(100, Math.round(savedCompletion)))
      );
    }
  }, [topics, selectedTopic]);

  async function refreshData() {
    const [s, t, sub, p, se, tr] = await Promise.all([
      api("/student"),
      api("/topics"),
      api("/subjects"),
      api("/plan"),
      api("/sessions"),
      api("/agent/trace"),
    ]);

    setStudent(s);
    setTopics(t);
    setSubjects(sub.map((x) => x.name));
    setPlan(p.latest_plan?.items || []);
    setSessions(se);
    setTrace(tr.trace || []);

    if (!selectedTopic && t.length) {
      setSelectedTopic(String(t[0].id));
    }
  }

  async function runAgent() {
    setBusy(true);

    try {
      const r = await api("/agent/run", {
        method: "POST",
      });

      setPlan(r.plan || []);
      setTrace(r.trace || []);
      setMessage("Fresh personalised plan generated");

      await refreshData();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addNewTopic() {
    if (!newTopic.subject.trim() || !newTopic.name.trim()) {
      setMessage("Enter both subject and topic name");
      return;
    }

    setBusy(true);

    try {
      const r = await api("/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: newTopic.subject.trim(),
          name: newTopic.name.trim(),
          difficulty: Number(newTopic.difficulty),
          estimated_hours: Number(newTopic.estimated_hours),
        }),
      });

      setMessage(
        `${r.topic} added to ${r.subject} · ${r.estimated_hours}h`
      );

      setNewTopic({
        subject: "",
        name: "",
        difficulty: 3,
        estimated_hours: 2,
      });

      setShowAddTopic(false);

      await refreshData();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveProgress() {
    if (!selectedTopic) {
      setMessage("Select a topic first");
      return;
    }

    setBusy(true);

    try {
      const r = await api("/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic_id: Number(selectedTopic),
          completion: Number(completion),
        }),
      });

      setMessage(
        `${r.topic}: ${r.completion}% complete · ${r.remaining_hours}h remaining`
      );

      await refreshData();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function createDemoSession() {
    if (!selectedTopic) {
      setMessage("Select a topic first");
      return;
    }

    setBusy(true);

    try {
      const r = await api("/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic_id: Number(selectedTopic),
          session_date: new Date().toISOString().slice(0, 10),
          duration: 2,
        }),
      });

      setSelectedSession(String(r.session_id));
      setMessage(`Session created for ${r.topic}`);

      await refreshData();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function missSelectedSession() {
    if (!selectedSession) {
      setMessage("Create/select a session first");
      return;
    }

    setBusy(true);

    try {
      const r = await api(
        `/sessions/${selectedSession}/miss`,
        {
          method: "POST",
        }
      );

      setMessage(
        `Autonomous replan triggered for ${r.topic}`
      );

      setTrace(
        r.autonomous_replan?.trace || []
      );

      setPlan(
        r.autonomous_replan?.plan || []
      );

      await refreshData();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function recordPerformance() {
    if (!selectedTopic) {
      setMessage("Select a topic first");
      return;
    }

    setBusy(true);

    try {
      const r = await api("/performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic_id: Number(selectedTopic),
          score: Number(score),
        }),
      });

      setMessage(
        r.adaptive_replan
          ? `Adaptive replan triggered for ${r.topic}`
          : `Performance ${r.score}% recorded`
      );

      if (r.adaptive_replan) {
        setTrace(r.adaptive_replan.trace || []);
        setPlan(r.adaptive_replan.plan || []);
      }

      await refreshData();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(
    () =>
      selectedSubject === "All"
        ? topics
        : topics.filter(
            (t) => t.subject === selectedSubject
          ),
    [topics, selectedSubject]
  );

  // Derived metrics for overview
  const totalEstHours = useMemo(
    () => topics.reduce((acc, t) => acc + Number(t.estimated_hours || 0), 0),
    [topics]
  );

  const totalRemainingHours = useMemo(
    () => topics.reduce((acc, t) => acc + Number(t.remaining_hours || 0), 0),
    [topics]
  );

  const completedSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === "completed").length,
    [sessions]
  );

  // Subject progress calculation
  const subjectProgress = useMemo(() => {
    const map = {};
    topics.forEach((t) => {
      if (!map[t.subject]) {
        map[t.subject] = { totalHours: 0, remainingHours: 0, count: 0 };
      }
      map[t.subject].totalHours += Number(t.estimated_hours || 0);
      map[t.subject].remainingHours += Number(t.remaining_hours || 0);
      map[t.subject].count += 1;
    });

    return Object.keys(map).map((sub) => {
      const item = map[sub];
      const completed = item.totalHours - item.remainingHours;
      const pct = item.totalHours > 0 ? Math.round((completed / item.totalHours) * 100) : 0;
      return {
        subject: sub,
        pct: Math.max(0, Math.min(100, pct)),
        count: item.count,
        remainingHours: item.remainingHours,
      };
    });
  }, [topics]);

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <GraduationCapIcon size={22} />
            </div>
            <div className="brand-info">
              <span className="brand-title">StudyPilot</span>
              <span className="brand-tag">AI Study Platform</span>
            </div>
          </div>

          <nav className="sidebar-nav-section">
            <span className="sidebar-nav-label">Main Menu</span>

            <a
              href="#dashboard"
              className={`nav-item ${activeNav === "Dashboard" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveNav("Dashboard"); }}
            >
              <span className="nav-item-icon"><DashboardIcon size={18} /></span>
              <span>Dashboard</span>
            </a>

            <a
              href="#syllabus"
              className={`nav-item ${activeNav === "Syllabus" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveNav("Syllabus"); }}
            >
              <span className="nav-item-icon"><BookIcon size={18} /></span>
              <span>Syllabus</span>
            </a>

            <a
              href="#plan"
              className={`nav-item ${activeNav === "Study Plan" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveNav("Study Plan"); }}
            >
              <span className="nav-item-icon"><CalendarIcon size={18} /></span>
              <span>Study Plan</span>
            </a>

            <a
              href="#sessions"
              className={`nav-item ${activeNav === "Study Sessions" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveNav("Study Sessions"); }}
            >
              <span className="nav-item-icon"><ClockIcon size={18} /></span>
              <span>Study Sessions</span>
            </a>

            <a
              href="#progress"
              className={`nav-item ${activeNav === "Progress" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveNav("Progress"); }}
            >
              <span className="nav-item-icon"><ChartIcon size={18} /></span>
              <span>Progress</span>
            </a>
          </nav>
        </div>

        {/* SIDEBAR PROFILE AREA (VISUAL UI ONLY - NO USER SWITCHING) */}
        <div className="sidebar-profile">
          <div className="profile-info">
            <div className="avatar-circle">S</div>
            <div className="profile-details">
              <span className="profile-name">Student</span>
              <span className="profile-role">Active Learner</span>
            </div>
          </div>
          <button className="logout-icon-btn" type="button" title="Logout (Visual UI)">
            <LogOutIcon size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="main-wrapper">
        {/* TOP HEADER */}
        <header className="top-header">
          <div className="header-left">
            <h2 className="header-title">Welcome back, Student</h2>
            <span className="header-subtitle">
              Plan smarter, track progress & adapt your schedule dynamically
            </span>
          </div>

          <div className="header-right">
            <div className="agent-status-badge">
              <span className="pulse-dot"></span>
              <span>{message}</span>
            </div>

            <button className="icon-button" type="button" title="Notifications">
              <BellIcon size={18} />
              <span className="notification-dot"></span>
            </button>

            <div className="header-user-avatar">
              <UserIcon size={18} />
            </div>
          </div>
        </header>

        {/* CONTENT BODY */}
        <main className="content-body">
          {/* HERO SECTION */}
          <section className="hero-card">
            <div className="hero-left">
              <div className="hero-badge">
                <SparklesIcon size={14} /> SMART STUDY PLANNER
              </div>
              <h1 className="hero-title">StudyPilot</h1>
              <p className="hero-description">
                Plan smarter. Stay consistent. Adapt your study schedule dynamically with AI agentic intelligence when sessions are missed or performance scores change.
              </p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={runAgent} disabled={busy}>
                  <PlayIcon size={16} /> {busy ? "Generating Plan..." : "Run AI Agent"}
                </button>
                <a href="#plan" className="btn-secondary">
                  View Latest Plan
                </a>
              </div>
            </div>

            <div className="hero-right">
              <img src="/study_hero.jpg" alt="Study Hero" className="hero-image" />
            </div>
          </section>

          {/* PASTEL SUMMARY STAT CARDS */}
          {student && (
            <section className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-card-top">
                  <span className="stat-label">STUDENT</span>
                  <div className="stat-icon-wrapper">
                    <UserIcon size={20} />
                  </div>
                </div>
                <div className="stat-value">{student.name}</div>
                <div className="stat-subtext">Active Enrolled Profile</div>
              </div>

              <div className="stat-card purple">
                <div className="stat-card-top">
                  <span className="stat-label">EXAM / GOAL</span>
                  <div className="stat-icon-wrapper">
                    <TargetIcon size={20} />
                  </div>
                </div>
                <div className="stat-value">{student.exam}</div>
                <div className="stat-subtext">Primary Target Goal</div>
              </div>

              <div className="stat-card pink">
                <div className="stat-card-top">
                  <span className="stat-label">EXAM DATE</span>
                  <div className="stat-icon-wrapper">
                    <CalendarIcon size={20} />
                  </div>
                </div>
                <div className="stat-value">{student.exam_date}</div>
                <div className="stat-subtext">Target Deadline</div>
              </div>

              <div className="stat-card green">
                <div className="stat-card-top">
                  <span className="stat-label">DAILY HOURS</span>
                  <div className="stat-icon-wrapper">
                    <ClockIcon size={20} />
                  </div>
                </div>
                <div className="stat-value">{student.daily_hours} h/day</div>
                <div className="stat-subtext">Planned Study Capacity</div>
              </div>
            </section>
          )}

          {/* OVERVIEW METRICS STRIP */}
          <section className="metrics-strip">
            <div className="metric-item">
              <div className="metric-icon-box blue">
                <BookIcon size={20} />
              </div>
              <div className="metric-data">
                <span className="metric-number">{topics.length}</span>
                <span className="metric-title">Curriculum Topics</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon-box purple">
                <ClockIcon size={20} />
              </div>
              <div className="metric-data">
                <span className="metric-number">{totalEstHours} h</span>
                <span className="metric-title">Planned Study Time</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon-box green">
                <CheckCircleIcon size={20} />
              </div>
              <div className="metric-data">
                <span className="metric-number">{sessions.length}</span>
                <span className="metric-title">Scheduled Sessions</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-icon-box yellow">
                <ZapIcon size={20} />
              </div>
              <div className="metric-data">
                <span className="metric-number">{totalRemainingHours} h</span>
                <span className="metric-title">Remaining Hours</span>
              </div>
            </div>
          </section>

          {/* MAIN MULTI-COLUMN DASHBOARD GRID */}
          <div className="dashboard-grid">
            {/* LEFT COLUMN (MAIN CARDS) */}
            <div className="grid-col-left">
              {/* AGENT ACTIVITY TIMELINE CARD */}
              <section className="card" id="agent">
                <div className="card-header">
                  <div className="card-header-info">
                    <h3 className="card-title">
                      <SparklesIcon size={18} style={{ color: "#2563EB" }} />
                      Study Planning Activity
                    </h3>
                    <span className="card-subtitle">
                      See how your study plan is created dynamically by the agent
                    </span>
                  </div>

                  <button className="btn-primary" onClick={runAgent} disabled={busy}>
                    <RefreshCwIcon size={14} /> {busy ? "Working..." : "Run Agent"}
                  </button>
                </div>

                <div className="trace-timeline">
                  {trace.length ? (
                    trace.map((item, index) => (
                      <div className="trace-item" key={index}>
                        <div className="trace-node">
                          <CheckCircleIcon size={14} />
                        </div>
                        <div className="trace-text">{item}</div>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">No agent execution trace available yet. Click "Run Agent" to initiate.</p>
                  )}
                </div>
              </section>

              {/* SMART ADAPTATION WORKFLOW & CONTROLS CARD */}
              <section className="card" id="adaptation">
                <div className="card-header">
                  <div className="card-header-info">
                    <h3 className="card-title">
                      <ZapIcon size={18} style={{ color: "#D97706" }} />
                      Smart Adaptation
                    </h3>
                    <span className="card-subtitle">
                      Demonstrate how StudyPilot rebalances your study plan automatically
                    </span>
                  </div>
                </div>

                {/* WORKFLOW DIAGRAMS */}
                <div className="workflow-section">
                  <div className="workflow-box missed">
                    <div className="workflow-header">
                      <AlertTriangleIcon size={14} /> Workflow 1: Missed Session
                    </div>
                    <div className="workflow-steps">
                      <span className="step-pill">Create Session</span>
                      <ChevronRightIcon size={14} className="step-arrow" />
                      <span className="step-pill">Miss Session</span>
                      <ChevronRightIcon size={14} className="step-arrow" />
                      <span className="step-pill">Plan Updated</span>
                    </div>
                  </div>

                  <div className="workflow-box performance">
                    <div className="workflow-header">
                      <SlidersIcon size={14} /> Workflow 2: Performance
                    </div>
                    <div className="workflow-steps">
                      <span className="step-pill">Record Score</span>
                      <ChevronRightIcon size={14} className="step-arrow" />
                      <span className="step-pill">Low Score</span>
                      <ChevronRightIcon size={14} className="step-arrow" />
                      <span className="step-pill">Plan Adapted</span>
                    </div>
                  </div>
                </div>

                {/* INTERACTIVE CONTROLS */}
                <div className="controls-grid" style={{ marginTop: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Selected Topic</label>
                    <select
                      className="form-control"
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                    >
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name} ({topic.subject})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Actual Progress %</label>
                    <div className="input-with-button">
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max="100"
                        value={completion}
                        onChange={(e) => setCompletion(e.target.value)}
                      />
                      <button className="btn-secondary" onClick={saveProgress} disabled={busy}>
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Session Management</label>
                    <button className="btn-secondary" onClick={createDemoSession} disabled={busy} style={{ width: "100%" }}>
                      <PlusIcon size={16} /> Create Study Session
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Active Session</label>
                    <select
                      className="form-control"
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                    >
                      <option value="">Select session</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          #{session.id} · {session.topic_name} · {session.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <button
                      className="btn-danger"
                      onClick={missSelectedSession}
                      disabled={busy || !selectedSession}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      <AlertTriangleIcon size={16} /> Miss Session → Trigger Autonomous Replan
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Latest Score Input</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ justifyContent: "flex-end" }}>
                    <label className="form-label" style={{ opacity: 0 }}>Record</label>
                    <button className="btn-primary" onClick={recordPerformance} disabled={busy} style={{ width: "100%" }}>
                      Record Performance
                    </button>
                  </div>
                </div>
              </section>

              {/* LATEST STUDY PLAN CARD */}
              <section className="card" id="plan">
                <div className="card-header">
                  <div className="card-header-info">
                    <h3 className="card-title">
                      <CalendarIcon size={18} style={{ color: "#2563EB" }} />
                      Latest Study Plan
                    </h3>
                    <span className="card-subtitle">
                      Current personalized plan stored in system database
                    </span>
                  </div>
                </div>

                <div className="plan-list">
                  {plan.length ? (
                    plan.map((item, index) => (
                      <div className="plan-item-card" key={index}>
                        <div className="plan-item-left">
                          <span className="day-badge">Day {item.day}</span>
                          <span className="plan-topic-title">{item.topic}</span>
                        </div>
                        <div className="duration-tag">
                          <ClockIcon size={13} /> {item.duration}h duration
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">
                      No study plan generated yet. Run the agent to generate your custom schedule.
                    </p>
                  )}
                </div>
              </section>

              {/* SYLLABUS / STUDY TASKS CARD */}
              <section className="card" id="syllabus">
                <div className="card-header">
                  <div className="card-header-info">
                    <h3 className="card-title">
                      <BookIcon size={18} style={{ color: "#2563EB" }} />
                      Syllabus & Study Tasks
                    </h3>
                    <span className="card-subtitle">
                      Manage curriculum chapters & target study effort
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowAddTopic(!showAddTopic)}
                    >
                      <PlusIcon size={16} /> Add Topic
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FilterIcon size={14} style={{ color: "#64748B" }} />
                      <select
                        className="form-control"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        style={{ height: "36px", padding: "0 10px", fontSize: "13px" }}
                      >
                        <option value="All">All Subjects</option>
                        {subjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ADD TOPIC EXPANDABLE FORM */}
                {showAddTopic && (
                  <div className="card" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5EAF1", boxShadow: "none" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700" }}>Add New Study Topic</h4>
                    <div className="controls-grid" style={{ marginTop: "8px" }}>
                      <div className="form-group">
                        <label className="form-label">Subject</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Physics"
                          value={newTopic.subject}
                          onChange={(e) => setNewTopic({ ...newTopic, subject: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Topic / Chapter</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Optics"
                          value={newTopic.name}
                          onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Difficulty</label>
                        <select
                          className="form-control"
                          value={newTopic.difficulty}
                          onChange={(e) => setNewTopic({ ...newTopic, difficulty: Number(e.target.value) })}
                        >
                          <option value="1">1 — Easy</option>
                          <option value="2">2 — Medium-Easy</option>
                          <option value="3">3 — Medium</option>
                          <option value="4">4 — Hard</option>
                          <option value="5">5 — Very Hard</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Estimated Hours</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0.5"
                          step="0.5"
                          value={newTopic.estimated_hours}
                          onChange={(e) => setNewTopic({ ...newTopic, estimated_hours: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                      <button className="btn-secondary" onClick={() => setShowAddTopic(false)}>Cancel</button>
                      <button className="btn-primary" onClick={addNewTopic} disabled={busy}>
                        {busy ? "Adding..." : "Add Topic →"}
                      </button>
                    </div>
                  </div>
                )}

                {/* TOPICS LIST */}
                <div className="topics-list">
                  {filtered.length ? (
                    filtered.map((topic) => {
                      const est = Number(topic.estimated_hours) || 1;
                      const rem = Number(topic.remaining_hours) || 0;
                      const donePct = Math.max(0, Math.min(100, Math.round(((est - rem) / est) * 100)));

                      return (
                        <div className="topic-item-card" key={topic.id}>
                          <div className="topic-card-top">
                            <span className="topic-name">{topic.name}</span>
                            <span className="subject-badge">{topic.subject}</span>
                          </div>

                          <div className="topic-meta">
                            <div className="difficulty-dots">
                              <span style={{ fontSize: "11px", fontWeight: "700", marginRight: "4px" }}>Difficulty:</span>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`difficulty-dot ${star <= topic.difficulty ? "filled" : ""}`}
                                />
                              ))}
                            </div>

                            <span>{topic.remaining_hours}h remaining / {topic.estimated_hours}h total</span>
                          </div>

                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${donePct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="muted-text">No topics found for the selected subject filter.</p>
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN (SIDE WIDGETS) */}
            <div className="grid-col-right">
              {/* TODAY'S SCHEDULE WIDGET */}
              <section className="card">
                <div className="card-header">
                  <div className="card-header-info">
                    <h3 className="card-title">
                      <ClockIcon size={18} style={{ color: "#2563EB" }} />
                      Today's Schedule
                    </h3>
                    <span className="card-subtitle">Upcoming study sessions</span>
                  </div>
                </div>

                <div className="schedule-list">
                  {sessions.length ? (
                    sessions.slice(0, 5).map((session, index) => (
                      <div className="schedule-item" key={session.id || index}>
                        <div className="schedule-time-box">
                          <span>Session</span>
                          <strong>#{session.id}</strong>
                        </div>

                        <div className="schedule-topic">
                          {session.topic_name}
                        </div>

                        <span className={`status-pill ${session.status || "upcoming"}`}>
                          {session.status || "Scheduled"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">No study sessions created yet.</p>
                  )}
                </div>
              </section>

              {/* CALENDAR STYLE WIDGET */}
              <section className="card">
                <div className="card-header">
                  <div className="card-header-info">
                    <h3 className="card-title">
                      <CalendarIcon size={18} style={{ color: "#2563EB" }} />
                      Calendar
                    </h3>
                    <span className="card-subtitle">October 2026</span>
                  </div>
                </div>

                <div className="calendar-widget">
                  <div className="calendar-grid">
                    <span className="calendar-day-head">Mo</span>
                    <span className="calendar-day-head">Tu</span>
                    <span className="calendar-day-head">We</span>
                    <span className="calendar-day-head">Th</span>
                    <span className="calendar-day-head">Fr</span>
                    <span className="calendar-day-head">Sa</span>
                    <span className="calendar-day-head">Su</span>

                    {/* Week 1 */}
                    <span className="calendar-day-cell other-month">28</span>
                    <span className="calendar-day-cell other-month">29</span>
                    <span className="calendar-day-cell other-month">30</span>
                    <span className="calendar-day-cell today">1</span>
                    <span className="calendar-day-cell has-session">2</span>
                    <span className="calendar-day-cell">3</span>
                    <span className="calendar-day-cell">4</span>

                    {/* Week 2 */}
                    <span className="calendar-day-cell has-session">5</span>
                    <span className="calendar-day-cell">6</span>
                    <span className="calendar-day-cell has-session">7</span>
                    <span className="calendar-day-cell">8</span>
                    <span className="calendar-day-cell">9</span>
                    <span className="calendar-day-cell">10</span>
                    <span className="calendar-day-cell">11</span>

                    {/* Week 3 */}
                    <span className="calendar-day-cell">12</span>
                    <span className="calendar-day-cell has-session">13</span>
                    <span className="calendar-day-cell">14</span>
                    <span className="calendar-day-cell">15</span>
                    <span className="calendar-day-cell has-session">16</span>
                    <span className="calendar-day-cell">17</span>
                    <span className="calendar-day-cell">18</span>
                  </div>
                </div>
              </section>

              {/* SUBJECT PROGRESS BREAKDOWN WIDGET */}
              <section className="card">
                <div className="card-header">
                  <div className="card-header-info">
                    <h3 className="card-title">
                      <ChartIcon size={18} style={{ color: "#2563EB" }} />
                      Subject Progress
                    </h3>
                    <span className="card-subtitle">Completion breakdown</span>
                  </div>
                </div>

                <div className="subject-progress-list">
                  {subjectProgress.length ? (
                    subjectProgress.map((sp) => (
                      <div className="subject-progress-item" key={sp.subject}>
                        <div className="subject-progress-info">
                          <span className="subject-name-tag">{sp.subject}</span>
                          <span className="subject-pct">{sp.pct}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${sp.pct}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">No subjects available.</p>
                  )}
                </div>
              </section>

              {/* RECENT STUDY SESSIONS LOG WIDGET */}
              <section className="card">
                <div className="card-header">
                  <div className="card-header-info">
                    <h3 className="card-title">
                      <SlidersIcon size={18} style={{ color: "#2563EB" }} />
                      Recent Sessions Log
                    </h3>
                    <span className="card-subtitle">Activity record</span>
                  </div>
                </div>

                <div className="schedule-list">
                  {sessions.length ? (
                    sessions.map((s) => (
                      <div className="schedule-item" key={s.id}>
                        <div className="schedule-topic">
                          <div style={{ fontWeight: "700" }}>{s.topic_name}</div>
                          <div style={{ fontSize: "11px", color: "#64748B" }}>Date: {s.session_date}</div>
                        </div>
                        <span className={`status-pill ${s.status}`}>
                          {s.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">No active session records.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [configured, setConfigured] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      try {
        const student = await api("/student");

        const hasRealProfile =
          student &&
          student.name &&
          student.name !== "Student";

        setConfigured(Boolean(hasRealProfile));
      } catch {
        setConfigured(false);
      } finally {
        setChecking(false);
      }
    }

    checkProfile();
  }, []);

  if (checking) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F5F8FC" }}>
        <div className="card" style={{ padding: "30px 50px", textAlign: "center" }}>
          <GraduationCapIcon size={40} style={{ color: "#2563EB", marginBottom: "12px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: "800" }}>Loading StudyPilot...</h2>
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <Setup
        onComplete={() => setConfigured(true)}
      />
    );
  }

  return <Dashboard />;
}

createRoot(document.getElementById("root")).render(<App />);
