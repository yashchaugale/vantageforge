from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/trade-event")
async def trade_event(event: dict):
    print("🔥 RECEIVED TRADE EVENT")
    print(event)

    return {"status": "received"}