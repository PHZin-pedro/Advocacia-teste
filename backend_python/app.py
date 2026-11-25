import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

load_dotenv()
app = FastAPI(title="AUREUM Advocacia API", version="3.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"

@app.get("/api/config")
def get_config():
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

if PUBLIC_DIR.exists():
    app.mount("/css", StaticFiles(directory=PUBLIC_DIR / "css"), name="css")
    app.mount("/js", StaticFiles(directory=PUBLIC_DIR / "js"), name="js")

@app.get("/")
def index():
    return FileResponse(PUBLIC_DIR / "index.html")
