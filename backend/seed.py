"""Seed script — run with: python seed.py"""

from datetime import date, timedelta

from app.database import SessionLocal, engine
from app.models import Base, KanbanCard, Request, Team

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Teams
teams_data = [
    {"name": "backend", "description": "Backend team"},
    {"name": "frontend", "description": "Frontend team"},
    {"name": "infra", "description": "Infrastructure team"},
]
teams = []
for t in teams_data:
    existing = db.query(Team).filter(Team.name == t["name"]).first()
    if not existing:
        team = Team(**t)
        db.add(team)
        db.flush()
        teams.append(team)
    else:
        teams.append(existing)

# Requests
today = date.today()

requests_data = [
    {
        "title": "Add export to CSV feature",
        "description": "Users need to export report data to CSV format",
        "business_impact": "High demand from enterprise clients",
        "requester": "Alice",
        "module": "Reports",
        "priority": "high",
        "status": "in_progress",
        "start_date": today - timedelta(days=3),
        "due_date": today + timedelta(days=11),
    },
    {
        "title": "Fix login timeout issue",
        "description": "Users are getting logged out after 5 minutes",
        "business_impact": "Affecting all users, support tickets increasing",
        "requester": "Bob",
        "module": "Auth",
        "priority": "critical",
        "status": "in_progress",
        "start_date": today - timedelta(days=1),
        "due_date": today + timedelta(days=4),
    },
    {
        "title": "Redesign dashboard",
        "description": "Current dashboard is cluttered and hard to navigate",
        "business_impact": "Key differentiator for new sales",
        "requester": "Carol",
        "module": "Dashboard",
        "priority": "medium",
        "status": "new",
        "start_date": today + timedelta(days=7),
        "due_date": today + timedelta(days=28),
    },
    {
        "title": "Add dark mode support",
        "description": "Users have been requesting dark mode",
        "business_impact": "Nice to have, improves user satisfaction",
        "requester": "Dave",
        "module": "UI",
        "priority": "low",
        "status": "triage",
        "start_date": today + timedelta(days=14),
        "due_date": today + timedelta(days=35),
    },
    {
        "title": "Optimize database queries",
        "description": "Several pages take > 3 seconds to load",
        "business_impact": "Performance directly impacts conversion rate",
        "requester": "Eve",
        "module": "Performance",
        "priority": "high",
        "status": "in_progress",
        "start_date": today + timedelta(days=2),
        "due_date": today + timedelta(days=16),
    },
]

reqs = []
for r in requests_data:
    existing = db.query(Request).filter(Request.title == r["title"]).first()
    if not existing:
        req = Request(**r)
        db.add(req)
        db.flush()
        reqs.append(req)
    else:
        existing.start_date = r.get("start_date")
        existing.due_date = r.get("due_date")
        reqs.append(existing)

# Kanban cards for in_progress requests
approved = [r for r in reqs if r.status == "in_progress"]
for i, req in enumerate(approved):
    existing = db.query(KanbanCard).filter(KanbanCard.request_id == req.id).first()
    if not existing:
        card = KanbanCard(
            request_id=req.id,
            team_id=teams[i % len(teams)].id,
            assignee=["Frank", "Grace", "Heidi"][i % 3],
            stage=["todo", "in_progress", "review"][i % 3],
            position=(i + 1) * 1000,
        )
        db.add(card)

db.commit()
db.close()

print("Seed data inserted successfully.")
