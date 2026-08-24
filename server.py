from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from ai.local_ai import LocalAIUnavailableError, analyze_patterns, analyze_trade, compare_trade, health as ai_health
from database.local_database import (
    SCREENSHOT_DIR,
    get_trade,
    initialise,
    list_trades,
    journal_analytics,
    delete_trade,
    list_experiments,
    create_experiment,
    update_experiment_status,
    search_trades,
    similar_trades,
    latest_ai_insight,
    save_ai_insight,
    storage_stats,
    upsert_trade,
)

app = FastAPI()

initialise()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"chrome-extension://.*|https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/trade-event")
async def trade_event(event: dict):
    trade = upsert_trade(event)

    return {"status": "received", "trade": trade}


@app.get("/health")
async def health():
    return {"status": "ok", **storage_stats()}


@app.get("/trades")
async def trades(limit: int = 100, offset: int = 0):
    return {"trades": list_trades(limit=limit, offset=offset)}


@app.get("/experiments")
async def experiments():
    return {"experiments": list_experiments()}


@app.post("/experiments")
async def new_experiment(payload: dict):
    if not payload.get("behavior"):
        raise HTTPException(status_code=400, detail="A behaviour is required")
    return {"experiment": create_experiment(payload)}


@app.patch("/experiments/{experiment_id}")
async def change_experiment_status(experiment_id: str, payload: dict):
    try:
        result = update_experiment_status(experiment_id, payload.get("status", ""))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if result is None:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return {"experiment": result}


@app.get("/analytics/summary")
async def analytics_summary():
    return journal_analytics()


@app.get("/trades/{trade_id}/similar")
async def similar_trade_records(trade_id: str, limit: int = 10):
    if get_trade(trade_id) is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    return {"trades": similar_trades(trade_id, limit=limit)}


@app.get("/trades/search")
async def search_trade_records(q: str = "", limit: int = 50):
    return {"trades": search_trades(q, limit=limit), "query": q}


@app.get("/trades/{trade_id}")
async def trade(trade_id: str):
    record = get_trade(trade_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Trade not found")

    return {"trade": record}


@app.put("/trades/{trade_id}")
async def update_trade(trade_id: str, payload: dict):
    if payload.get("id") not in (None, trade_id):
        raise HTTPException(status_code=400, detail="Trade ID does not match the URL")

    payload["id"] = trade_id
    return {"trade": upsert_trade(payload)}


@app.delete("/trades/{trade_id}")
async def remove_trade(trade_id: str):
    if not delete_trade(trade_id):
        raise HTTPException(status_code=404, detail="Trade not found")
    return {"status": "deleted", "tradeId": trade_id}


@app.get("/screenshots/{filename}")
async def screenshot(filename: str):
    candidate = (SCREENSHOT_DIR / filename).resolve()
    if candidate.parent != SCREENSHOT_DIR.resolve() or not candidate.is_file():
        raise HTTPException(status_code=404, detail="Screenshot not found")

    return FileResponse(candidate)


@app.get("/ai/health")
async def local_ai_health():
    return ai_health()


@app.get("/ai/insights/{trade_id}")
async def trade_insight(trade_id: str):
    return {"insight": latest_ai_insight(trade_id)}


@app.post("/ai/compare/{trade_id}")
async def compare_trade_locally(trade_id: str):
    target = get_trade(trade_id)
    if target is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    matches = similar_trades(trade_id, limit=10)
    try:
        result = compare_trade(target, matches)
    except LocalAIUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"matches": matches, "insight": result}


@app.post("/ai/analyze-patterns")
async def analyze_patterns_locally():
    analytics = journal_analytics()
    try:
        result = analyze_patterns(analytics)
    except LocalAIUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"analytics": analytics, "insight": result}


@app.post("/ai/analyze/{trade_id}")
async def analyze_trade_locally(trade_id: str):
    record = get_trade(trade_id)

    if record is None:
        raise HTTPException(status_code=404, detail="Trade not found")

    try:
        result = analyze_trade(record)
    except LocalAIUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    insight = save_ai_insight(
        trade_id,
        result["summary"],
        result["action"],
        result["model"],
        result["promptVersion"],
    )
    return {"insight": insight}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8765)
