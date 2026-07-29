# run_demo.ps1 - Nyalakan demo sirine (backend FastAPI + frontend Gradio) sekali jalan.
#
#   Klik-kanan > Run with PowerShell,  ATAU dari terminal:
#       powershell -ExecutionPolicy Bypass -File .\run_demo.ps1
#
# Backend dinyalakan di jendela terpisah, ditunggu sampai siap, lalu frontend jalan di
# jendela ini. Tekan Ctrl+C untuk berhenti - backend ikut dimatikan otomatis.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$py = Join-Path $root ".venv\Scripts\python.exe"
$port = 8000

if (-not (Test-Path $py)) {
    Write-Host "[X] Interpreter venv tidak ditemukan: $py" -ForegroundColor Red
    Write-Host "    Buat/aktifkan venv dulu (lihat CLAUDE.md bagian Environment)." -ForegroundColor Yellow
    exit 1
}

Write-Host "==> Menyalakan backend (uvicorn :$port) di jendela terpisah..." -ForegroundColor Cyan
$backend = Start-Process -FilePath $py `
    -ArgumentList "-m", "uvicorn", "backend.main:app", "--port", "$port" `
    -WorkingDirectory $root -PassThru

try {
    Write-Host "==> Menunggu backend siap (muat YAMNet + 2 model, ~15-25 dtk)..." -ForegroundColor Cyan
    $ready = $false
    for ($i = 0; $i -lt 90; $i++) {
        if ($backend.HasExited) { throw "Proses backend berhenti mendadak. Jalankan uvicorn manual untuk lihat error." }
        try {
            $r = Invoke-WebRequest "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -eq 200) { $ready = $true; break }
        } catch { Start-Sleep -Seconds 1 }
    }
    if (-not $ready) { throw "Backend tak kunjung siap dalam 90 dtk." }

    Write-Host "==> Backend SIAP  ->  http://localhost:$port  (dokumentasi: /docs)" -ForegroundColor Green
    Write-Host "==> Menyalakan frontend Gradio (buka URL yang muncul di bawah)..." -ForegroundColor Cyan
    Write-Host ""

    $env:BACKEND_URL = "http://localhost:$port"
    & $py (Join-Path $root "frontend-gradio\app.py")
}
finally {
    if ($backend -and -not $backend.HasExited) {
        Write-Host "`n==> Mematikan backend..." -ForegroundColor Cyan
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Selesai." -ForegroundColor Green
}
