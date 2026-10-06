Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   LEARNFLOW AI — ADAPTIVE MULTI-AGENT TUTOR     " -ForegroundColor Yellow
Write-Host "   Track D: Personalized Tutoring & Adaptive     " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if database is initialized
Write-Host "`n[1/3] Initializing Database & Knowledge Base..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\backend"
python -m app.database.init_db

Write-Host "`n[2/3] Starting Backend API on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "`n[3/3] Starting Frontend Dev Server on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`nLearnFlow AI is starting up!" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "Demo Credentials: demo@learnflow.ai / demo1234" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan
