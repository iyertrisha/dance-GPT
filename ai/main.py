from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root (where GROQ_API_KEY lives) and ai/
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv()

from fastapi import FastAPI
from routers import chat, study

app = FastAPI(title="DanceGPT AI Service", version="0.1.0")

# Mount routers
app.include_router(chat.router)
app.include_router(study.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
