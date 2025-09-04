@echo off
:: Development startup script for Complaint Management System

echo 🚀 Starting Complaint Management System...

:: Start Backend
echo 📡 Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend
echo 🎨 Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ✅ Both servers are starting...
echo 📡 Backend: http://localhost:5000
echo 🎨 Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
