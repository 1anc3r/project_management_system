@echo off

node -v >nul 2>&1
if errorlevel 1 (
    echo [Error] Node.js not detected. Please install Node.js 18 or above first.
    pause
    exit /b 1
)
echo [Success] Environment check passed
echo.

echo [Info] Starting the backend service...
cd backend
if not exist "node_modules" (
    echo [Info] Installing backend dependencies...
    call npm install
)
start cmd /c "npm run dev & pause"
echo [Success] The backend service has been started
echo.

cd ..

echo [Info] Starting the frontend service...
cd frontend
if not exist "node_modules" (
    echo [Info] Installing frontend dependencies...
    call npm install
)
start cmd /c "npm run dev & pause"
echo [Success] The frontend service has been started
echo.

pause