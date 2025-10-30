@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM Create venv if not exists
if not exist .venv (
    py -3 -m venv .venv
)

call .venv\Scripts\activate
pip install -r requirements.txt >NUL 2>&1

start "" "http://localhost:8000/"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload


