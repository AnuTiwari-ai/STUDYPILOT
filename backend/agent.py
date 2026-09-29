from tools import (
    get_student_state,
    get_syllabus,
    get_progress,
    calculate_available_time,
    create_study_plan,
    update_study_plan,
)


def _priority(topic, progress_by_name):
    p = progress_by_name.get(topic["name"], {})
    performance = float(p.get("avg_performance") or 0)
    missed = int(p.get("missed_sessions") or 0)
    # Higher difficulty, more remaining work, lower performance and missed
    # sessions increase priority for the next autonomous plan.
    weakness = max(0, 100 - performance) / 100 if performance else 0.5
    return (
        (int(topic["difficulty"]) * 2)
        + float(topic["remaining_hours"])
        + weakness * 3
        + (missed * 4)
    )


def build_agent_plan(reason="Agent generated plan"):
    student = get_student_state()
    syllabus = get_syllabus()
    progress = get_progress()
    available = calculate_available_time()

    progress_by_name = {p["name"]: p for p in progress}
    topics = sorted(syllabus, key=lambda t: _priority(t, progress_by_name), reverse=True)

    daily_hours = float(student["daily_hours"]) if student else 4.0
    max_days = 5
    remaining_total = min(available, daily_hours * max_days)
    plan = []
    day = 1
    remaining_day = daily_hours

    for topic in topics:
        left = float(topic["remaining_hours"])
        while left > 0 and day <= max_days and remaining_total > 0:
            block = min(2.0, left, remaining_day, remaining_total)
            if block <= 0:
                break
            plan.append({"day": day, "topic": topic["name"], "duration": round(block, 2)})
            left -= block
            remaining_day -= block
            remaining_total -= block
            if remaining_day <= 0.001:
                day += 1
                remaining_day = daily_hours

    return plan


def run_agent(reason="Agent generated plan", update=False, event_trace=None):
    student = get_student_state()
    syllabus = get_syllabus()
    progress = get_progress()
    available = calculate_available_time()
    plan = build_agent_plan(reason)

    if update:
        plan_id, version = update_study_plan(plan, reason)
    else:
        plan_id = create_study_plan(plan, reason)
        version = 1

    trace = [
        "✓ Retrieved student state",
        f"✓ Checked {len(syllabus)} syllabus topics",
        f"✓ Reviewed progress for {len(progress)} topics",
        f"✓ Calculated {available:g} available study hours",
    ]
    if event_trace:
        trace.extend(event_trace)
    trace.extend([
        "✓ Prioritised topics using difficulty, remaining work and performance",
        "✓ Generated study schedule",
        f"✓ Saved Plan v{version}",
    ])

    return {
        "version": version,
        "plan_id": plan_id,
        "reason": reason,
        "available_hours": available,
        "plan": plan,
        "trace": trace,
    }


def handle_missed_session(session_id):
    """Autonomously replan after a student misses a scheduled session."""
    return run_agent(
        "Autonomous replan after missed session",
        update=True,
        event_trace=[
            f"✓ Detected missed session #{session_id}",
            "✓ Recalculated topic priorities after missed work",
            "✓ Generated autonomous recovery plan",
        ],
    )


def handle_poor_performance(topic_name, score):
    """Autonomously adapt the plan after a low performance score."""
    return run_agent(
        f"Adaptive replan after low performance in {topic_name}",
        update=True,
        event_trace=[
            f"✓ Detected low performance: {topic_name} scored {score:g}%",
            "✓ Increased priority for weaker topics",
            "✓ Generated adaptive recovery plan",
        ],
    )


def create_basic_plan(reason="Initial plan"):
    return build_agent_plan(reason)
