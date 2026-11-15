$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.venv')) {
    py -3 -m venv .venv
}

& .\.venv\Scripts\python.exe -m pip install -q -r backend\requirements.txt
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }

$port = if ($env:PORT) { $env:PORT } else { '8000' }
& .\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port $port --reload --no-access-log
