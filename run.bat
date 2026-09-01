@echo off
echo ==================================================
echo Starting RobbyTopup Backend and Frontend...
echo ==================================================

:: Start Backend in a new window
echo Starting Backend API on http://localhost:5001...
start "RobbyTopup Backend API" cmd /k "cd backend && npm run dev"

:: Start Frontend in a new window
echo Starting Frontend Web App on http://localhost:3000...
start "RobbyTopup Frontend Web" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched in new console windows!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5001
echo.
pause
