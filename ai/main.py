from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from routers import chat

app = FastAPI(title="DanceGPT AI Service", version="0.1.0")

# Mount routers
app.include_router(chat.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
