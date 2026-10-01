import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

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
    <main className="app">
      <header className="hero">
        <div>
          <div className="eyebrow">📚 STUDYPILOT · AGENTIC STUDY PLANNER</div>
          <h1>StudyPilot</h1>
          <p>
            Create your study profile and let the AI agent build an adaptive
            study plan from your actual goals, tasks and progress.
          </p>
        </div>
      </header>

      <section className="card setupCard">
        <div className="cardHead">
          <div>
            <h2>🎯 Create Your Study Profile</h2>
            <small>
              Enter your real study information. The agent will use it to
              generate your plan.
            </small>
          </div>
        </div>

        <div className="setupGrid">
          <div className="control">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="e.g. Anu"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="control">
            <label>Exam / Study Goal</label>
            <input
              type="text"
              placeholder="e.g. JEE 2026"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
            />
          </div>

          <div className="control">
            <label>Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div className="control">
            <label>Daily Study Hours</label>
            <input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
            />
          </div>
        </div>

        <div className="setupSection">
          <div className="sectionTitle">
            <div>
              <h3>Subjects</h3>
              <small>What subjects are you preparing?</small>
            </div>

            <button type="button" onClick={addSubject}>
              + Add Subject
            </button>
          </div>

          {subjects.map((subject, index) => (
            <div className="taskRow" key={index}>
              <input
                type="text"
                placeholder="e.g. Mathematics"
                value={subject}
                onChange={(e) =>
                  updateSubject(index, e.target.value)
                }
              />

              {subjects.length > 1 && (
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => removeSubject(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="setupSection">
          <div className="sectionTitle">
            <div>
              <h3>Study Tasks</h3>
              <small>
                Add the actual chapters/topics you need to study.
              </small>
            </div>

            <button type="button" onClick={addTask}>
              + Add Task
            </button>
          </div>

          {tasks.map((task, index) => (
            <div className="taskEditor" key={index}>
              <input
                type="text"
                placeholder="Subject"
                value={task.subject}
                onChange={(e) =>
                  updateTask(index, "subject", e.target.value)
                }
              />

              <input
                type="text"
                placeholder="Task / Chapter"
                value={task.name}
                onChange={(e) =>
                  updateTask(index, "name", e.target.value)
                }
              />

              <select
                value={task.difficulty}
                onChange={(e) =>
                  updateTask(index, "difficulty", e.target.value)
                }
              >
                <option value="1">Difficulty 1</option>
                <option value="2">Difficulty 2</option>
                <option value="3">Difficulty 3</option>
                <option value="4">Difficulty 4</option>
                <option value="5">Difficulty 5</option>
              </select>

              <input
                type="number"
                min="0.5"
                step="0.5"
                placeholder="Hours"
                value={task.estimated_hours}
                onChange={(e) =>
                  updateTask(index, "estimated_hours", e.target.value)
                }
              />

              {tasks.length > 1 && (
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => removeTask(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {error && <div className="errorBox">{error}</div>}

        <button
          className="primaryButton"
          onClick={createProfile}
          disabled={busy}
        >
          {busy ? "Creating Study Profile..." : "Create Study Profile →"}
        </button>
      </section>
    </main>
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

  return (
    <main className="app">
      <header className="hero">
        <div>
          <div className="eyebrow">
            📚 STUDYPILOT · FINAL AGENTIC BUILD
          </div>

          <h1>StudyPilot</h1>

          <p>
            AI-powered planning that adapts when study
            sessions are missed or performance changes.
          </p>
        </div>

        <div className="status">
          ● {message}
        </div>
      </header>

      {student && (
        <section className="stats">
          <div>
            <span>Student</span>
            <strong>{student.name}</strong>
          </div>

          <div>
            <span>Exam / Goal</span>
            <strong>{student.exam}</strong>
          </div>

          <div>
            <span>Exam Date</span>
            <strong>{student.exam_date}</strong>
          </div>

          <div>
            <span>Daily Hours</span>
            <strong>{student.daily_hours} h</strong>
          </div>
        </section>
      )}

      <section className="card agentCard">
        <div className="cardHead">
          <div>
            <h2>🤖 Agent Activity</h2>
            <small>
              Live decisions from the current student state
            </small>
          </div>

          <button
            onClick={runAgent}
            disabled={busy}
          >
            {busy
              ? "Working..."
              : "Run Agent"}
          </button>
        </div>

        <div className="trace">
          {trace.map((item, index) => (
            <div key={index}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="card demoCard">
        <div className="cardHead">
          <div>
            <h2>⚡ Study Controls</h2>
            <small>
              Update your real progress and demonstrate
              autonomous adaptation.
            </small>
          </div>
        </div>

        <div className="controls">
          <div className="control">
            <label>Topic</label>

            <select
              value={selectedTopic}
              onChange={(e) =>
                setSelectedTopic(e.target.value)
              }
            >
              {topics.map((topic) => (
                <option
                  key={topic.id}
                  value={topic.id}
                >
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control score">
            <label>Actual Progress %</label>

            <input
              type="number"
              min="0"
              max="100"
              value={completion}
              onChange={(e) =>
                setCompletion(e.target.value)
              }
            />
          </div>

          <button
            onClick={saveProgress}
            disabled={busy}
          >
            Save Progress
          </button>

          <div className="control score">
            <label>Latest Score</label>

            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) =>
                setScore(e.target.value)
              }
            />
          </div>

          <button
            onClick={recordPerformance}
            disabled={busy}
          >
            Record Performance
          </button>

          <button
            onClick={createDemoSession}
            disabled={busy}
          >
            Create Study Session
          </button>

          <div className="control">
            <label>Session</label>

            <select
              value={selectedSession}
              onChange={(e) =>
                setSelectedSession(e.target.value)
              }
            >
              <option value="">
                Select session
              </option>

              {sessions.map((session) => (
                <option
                  key={session.id}
                  value={session.id}
                >
                  #{session.id} · {session.topic_name} ·{" "}
                  {session.status}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={missSelectedSession}
            disabled={busy || !selectedSession}
          >
            Miss Session → Replan
          </button>
        </div>
      </section>

      <div className="grid">
        <section className="card">
          <div className="cardHead">
            <div>
              <h2>Latest Study Plan</h2>

              <small>
                Current personalised plan saved in SQLite
              </small>
            </div>
          </div>

          {plan.length ? (
            plan.map((item, index) => (
              <div
                className="planRow"
                key={index}
              >
                <span>
                  Day {item.day}
                </span>

                <strong>
                  {item.topic}
                </strong>

                <em>
                  {item.duration}h
                </em>
              </div>
            ))
          ) : (
            <p className="muted">
              Run the agent to create a personalised plan.
            </p>
          )}
        </section>

        <section className="card">
          <div className="cardHead">
            <div>
              <h2>Study Tasks</h2>

              <small>
                Tasks currently used by the agent
              </small>
              <button
  type="button"
  className="secondaryButton"
  onClick={() => setShowAddTopic(!showAddTopic)}
>
  + Add Topic
</button>
            </div>

            <select
              value={selectedSubject}
              onChange={(e) =>
                setSelectedSubject(e.target.value)
              }
            >
              <option>All</option>

              {subjects.map((subject) => (
                <option
                  key={subject}
                >
                  {subject}
                </option>
              ))}
            </select>
          </div>
{showAddTopic && (
  <div className="setupSection">
    <div className="setupGrid">
      <div className="control">
        <label>Subject</label>
        <input
          type="text"
          placeholder="e.g. Physics"
          value={newTopic.subject}
          onChange={(e) =>
            setNewTopic({
              ...newTopic,
              subject: e.target.value,
            })
          }
        />
      </div>

      <div className="control">
        <label>Topic / Chapter</label>
        <input
          type="text"
          placeholder="e.g. Optics"
          value={newTopic.name}
          onChange={(e) =>
            setNewTopic({
              ...newTopic,
              name: e.target.value,
            })
          }
        />
      </div>

      <div className="control">
        <label>Difficulty</label>
        <select
          value={newTopic.difficulty}
          onChange={(e) =>
            setNewTopic({
              ...newTopic,
              difficulty: Number(e.target.value),
            })
          }
        >
          <option value="1">1 — Easy</option>
          <option value="2">2</option>
          <option value="3">3 — Medium</option>
          <option value="4">4</option>
          <option value="5">5 — Hard</option>
        </select>
      </div>

      <div className="control">
        <label>Estimated Hours</label>
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={newTopic.estimated_hours}
          onChange={(e) =>
            setNewTopic({
              ...newTopic,
              estimated_hours: Number(e.target.value),
            })
          }
        />
      </div>
    </div>

    <div style={{ marginTop: "12px" }}>
      <button
        type="button"
        className="primaryButton"
        onClick={addNewTopic}
        disabled={busy}
      >
        {busy ? "Adding..." : "Add Topic →"}
      </button>
    </div>
  </div>
)}
          {filtered.map((topic) => (
            <div
              className="row"
              key={topic.id}
            >
              <div>
                <strong>
                  {topic.name}
                </strong>

                <small>
                  {topic.subject} · Difficulty{" "}
                  {topic.difficulty}/5 ·{" "}
                  {topic.remaining_hours}h remaining
                </small>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function App() {
  const [configured, setConfigured] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

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
      <main className="app">
        <div className="card">
          <h2>Loading StudyPilot...</h2>
        </div>
      </main>
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

createRoot(
  document.getElementById("root")
).render(<App />);
