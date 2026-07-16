from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from utils.logger import write_log

app = FastAPI()

# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# MODELO
# -----------------------------

class LogRequest(BaseModel):
    action: str
    detail: str

# -----------------------------
# RUTA PRINCIPAL
# -----------------------------

@app.get("/")
def inicio():
    return {"mensaje": "PawFinder API funcionando"}

# -----------------------------
# RUTA PARA LOGS
# -----------------------------

@app.post("/log")
def create_log(log: LogRequest):

    write_log(log.action, log.detail)

    return {
        "status": "ok",
        "message": "Log registrado"
    }