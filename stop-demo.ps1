# stop-demo.ps1 — hentikan app + tunnel (link publik mati).
docker rm -f sirine_live sirinetunnel *> $null
Write-Host ""
Write-Host "Demo dihentikan. Link publik sudah mati." -ForegroundColor Yellow
Write-Host "Untuk menyalakan lagi: dobel-klik start-demo.cmd (URL akan baru)." -ForegroundColor Cyan
Write-Host ""
Read-Host "Tekan Enter untuk menutup"
