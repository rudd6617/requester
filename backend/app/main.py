from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, comments, kanban, requests, teams

app = FastAPI(title="Request SigKnow", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(requests.router)
app.include_router(kanban.router)
app.include_router(comments.router)
