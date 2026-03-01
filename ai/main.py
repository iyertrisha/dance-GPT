from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI

app = FastAPI(title="DanceGPT AI Service", version="0.1.0")


@app.get("/health")
async def health():
    return {"status": "ok"}
