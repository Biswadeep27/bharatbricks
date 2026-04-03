import os

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.backend import list_volume_files, get_file_preview

app = FastAPI(title="BharatBricks - ArXiv Explorer")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", response_class=HTMLResponse)
async def index():
    with open(os.path.join(STATIC_DIR, "index.html")) as f:
        return HTMLResponse(content=f.read())


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/files")
async def get_files():
    """List JSON files in the volume. Uses app (SP) auth."""
    try:
        files = list_volume_files()
        return {"files": files}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/file-preview")
async def file_preview(request: Request, filename: str):
    """Get schema and sample record for a JSON file.

    Uses OBO user auth when deployed (x-forwarded-access-token header).
    Falls back to app (SP) auth for local development.
    """
    user_token = request.headers.get("x-forwarded-access-token")
    try:
        result = get_file_preview(filename, user_token)
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
