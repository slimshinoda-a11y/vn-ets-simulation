@echo off
title Vietnam ETS Simulation - Online Launcher
chcp 65001 >nul
echo ======================================================================
echo    VIETNAM ETS SIMULATION PLATFORM - KHỞI CHẠY TRỰC TUYẾN
echo ======================================================================
echo.
echo [1/2] Đang khởi động Backend Server (cổng 3001)...
start "ETS Backend Server" /min node server/index.js
timeout /t 3 /nobreak >nul

echo [2/2] Đang thiết lập Cloudflare Tunnel...
echo.
echo ======================================================================
echo  Vui lòng tìm dòng "https://xxxx.trycloudflare.com" bên dưới để lấy link!
echo  Gửi đường link đó cho người tham gia truy cập từ xa.
echo  (Nhấn Ctrl+C để dừng mô phỏng khi hoàn thành)
echo ======================================================================
echo.

.\cloudflared.exe tunnel --url http://127.0.0.1:3001
pause
