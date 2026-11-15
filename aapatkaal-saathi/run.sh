#!/usr/bin/env sh
# Local run:  ./run.sh   -> http://localhost:8000
set -e
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate
pip install -q -r backend/requirements.txt
exec uvicorn backend.main:app --host 0.0.0.0 --port "${PORT:-8000}" --reload --no-access-log
