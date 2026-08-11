@echo off
title BumiMetrics - Local AI Engine & API Server
echo =====================================================================
echo 🌿 Memulai BumiMetrics Local AI Server (FastAPI + VAR Model Engine)
echo 🚀 Berjalan 100%% Lokal dan Offline di Komputer Anda
echo =====================================================================
echo.
cd /d "%~dp0"

echo [1/2] Memeriksa & Melatih Model Data Iklim (1996 - 2025)...
python scripts/train_models.py

echo.
echo [2/2] Menjalankan Server Local AI pada http://127.0.0.1:8765 ...
echo Silakan buka index.html di browser untuk menggunakan Dashboard & Studio AI Lokal.
echo Tekan CTRL+C untuk menghentikan server.
echo.
python scripts/local_ai_server.py

pause
