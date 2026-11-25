"""
================================================================================
BACKEND ALTERNATIVO EM PYTHON (FASTAPI)
Caso prefira hospedar o backend em Python (Render / Railway / VPS) em vez de Node.js,
execute:
    pip install -r backend_python/requirements.txt
    uvicorn backend_python.app:app --host 0.0.0.0 --port 8000
================================================================================
"""
import os
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="AUREUM Advocacia API (Python)", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "public"


class DocumentValidationRequest(BaseModel):
    file_name: str
    file_size_bytes: int
    mime_type: str


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "runtime": "python-fastapi",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/config")
def get_public_config():
    return {
        "supabaseUrl": os.getenv("SUPABASE_URL", ""),
        "supabaseAnonKey": os.getenv("SUPABASE_ANON_KEY", ""),
        "adminInviteCode": os.getenv("ADMIN_INVITE_CODE", "AUREUM-ADMIN-2026"),
        "firmName": os.getenv("FIRM_NAME", ""),
        "lawyerName": os.getenv("LAWYER_NAME", ""),
        "lawyerOab": os.getenv("LAWYER_OAB", ""),
        "lawyerEmail": os.getenv("LAWYER_EMAIL", ""),
        "lawyerPhone": os.getenv("LAWYER_PHONE", ""),
        "firmAddress": os.getenv("FIRM_ADDRESS", "")
    }


@app.post("/api/validate-document")
def validate_document(payload: DocumentValidationRequest):
    allowed_extensions = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"}
    ext = Path(payload.file_name).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Formato de arquivo não permitido.")
    if payload.file_size_bytes > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="O arquivo excede o limite de 15MB.")
    return {"valid": True, "file_name": payload.file_name}


if PUBLIC_DIR.exists():
    app.mount("/css", StaticFiles(directory=PUBLIC_DIR / "css"), name="css")
    app.mount("/js", StaticFiles(directory=PUBLIC_DIR / "js"), name="js")


@app.get("/")
def serve_index():
    return FileResponse(PUBLIC_DIR / "index.html")


@app.get("/login")
def serve_login():
    return FileResponse(PUBLIC_DIR / "login.html")


@app.get("/cliente")
def serve_client():
    return FileResponse(PUBLIC_DIR / "cliente.html")


@app.get("/admin")
def serve_admin():
    return FileResponse(PUBLIC_DIR / "admin.html")
