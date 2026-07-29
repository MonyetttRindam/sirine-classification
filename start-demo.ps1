# ===========================================================================
# start-demo.ps1 - nyalakan aplikasi + tunnel publik, lalu tampilkan URL.
# Cara pakai: dobel-klik start-demo.cmd
# ===========================================================================
$ErrorActionPreference = "Continue"
$IMAGE = "sirine:local"
$APP   = "sirine_live"
$TUN   = "sirinetunnel"
$PORT  = 7860

Write-Host ""
Write-Host "===== SIRINE - START DEMO =====" -ForegroundColor Cyan

# 1. Pastikan Docker jalan.
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker belum jalan. Membuka Docker Desktop..." -ForegroundColor Yellow
    $dd = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dd) { Start-Process $dd }
    Write-Host -NoNewline "Menunggu Docker siap"
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 5
        Write-Host -NoNewline "."
        docker info *> $null
        if ($LASTEXITCODE -eq 0) { break }
    }
    Write-Host ""
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker tidak kunjung siap. Buka Docker Desktop manual, lalu ulangi." -ForegroundColor Red
        Read-Host "Tekan Enter untuk menutup"
        exit 1
    }
}
Write-Host "Docker: OK" -ForegroundColor Green

# 2. Pastikan image sudah ada.
docker image inspect $IMAGE *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Image '$IMAGE' belum ada. Build dulu sekali saja dengan:" -ForegroundColor Red
    Write-Host "    docker build -t $IMAGE ." -ForegroundColor Red
    Read-Host "Tekan Enter untuk menutup"
    exit 1
}

# 3. Bersihkan sisa container lama.
docker rm -f $APP $TUN *> $null

# 4. Jalankan aplikasi.
Write-Host "Menyalakan aplikasi..." -ForegroundColor Cyan
docker run -d --name $APP -p "${PORT}:${PORT}" $IMAGE *> $null

# 5. Tunggu model siap.
Write-Host -NoNewline "Memuat model"
$healthy = $false
for ($i = 0; $i -lt 40; $i++) {
    try {
        $r = Invoke-WebRequest "http://localhost:$PORT/health" -TimeoutSec 3 -UseBasicParsing
        if ($r.StatusCode -eq 200) { $healthy = $true; break }
    } catch {}
    Write-Host -NoNewline "."
    Start-Sleep -Seconds 3
}
Write-Host ""
if (-not $healthy) {
    Write-Host "Aplikasi tidak sehat. Lihat log dengan: docker logs $APP" -ForegroundColor Red
    Read-Host "Tekan Enter untuk menutup"
    exit 1
}
Write-Host "Aplikasi siap." -ForegroundColor Green

# 6. Buka tunnel publik.
Write-Host "Membuka tunnel publik (Cloudflare)..." -ForegroundColor Cyan
docker run -d --name $TUN cloudflare/cloudflared:latest tunnel --url "http://host.docker.internal:$PORT" *> $null

# 7. Ambil URL trycloudflare dari log.
$url = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    $log = (docker logs $TUN 2>&1 | Out-String)
    if ($log -match "https://[a-zA-Z0-9.-]+\.trycloudflare\.com") { $url = $Matches[0]; break }
}

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Green
if ($url) {
    Write-Host "  URL PUBLIK (bagikan ke orang lain):" -ForegroundColor Green
    Write-Host "     $url" -ForegroundColor White
} else {
    Write-Host "  Tunnel belum memberi URL. Coba: docker logs $TUN" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Di laptop ini (lokal): http://localhost:$PORT" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Catatan penting:" -ForegroundColor Cyan
Write-Host " - Tes URL publik lewat HP pakai DATA SELULER (WiFi ini blokir trycloudflare)."
Write-Host " - Biarkan laptop NYALA selama demo. Laptop mati = link mati."
Write-Host " - Selesai demo: dobel-klik stop-demo.cmd."
Write-Host ""
Read-Host "Tekan Enter untuk menutup jendela ini. App dan tunnel tetap jalan"
