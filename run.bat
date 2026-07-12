@echo off
echo ==================================================
echo 🚀 Starting DaraTopup Backend and Frontend...
echo ==================================================

:: Start Backend in a new window
echo Starting Backend API on http://localhost:5000...
start "DaraTopup Backend API" cmd /k "cd backend && npm run dev"

:: Start Frontend in a new window
echo Starting Frontend Web App on http://localhost:3000...
start "DaraTopup Frontend Web" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers have been launched in new console windows!
echo.
pause
