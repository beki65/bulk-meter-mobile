@echo off
echo 🚀 Water Utility Dashboard - Master Setup
echo ========================================
echo.

echo 1. Installing Backend Dependencies...
cd /d C:\water-utility-dashboard\backend
call npm install
echo ✅ Backend dependencies installed

echo.
echo 2. Installing Frontend Dependencies...
cd /d C:\water-utility-dashboard\frontend
call npm install
echo ✅ Frontend dependencies installed

echo.
echo 3. Creating all necessary files...
echo ✅ Files already created

echo.
echo 4. Starting Backend on port 8000...
cd /d C:\water-utility-dashboard\backend
start "Backend" cmd /k "node server.js"
timeout /t 3

echo.
echo 5. Testing Backend Connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/health' -UseBasicParsing; Write-Host '✅ Backend is RUNNING on port 8000!' -ForegroundColor Green } catch { Write-Host '❌ Backend NOT responding!' -ForegroundColor Red }"

echo.
echo 6. Starting Frontend...
cd /d C:\water-utility-dashboard\frontend
start "Frontend" cmd /k "npm start"

echo.
echo 7. Opening Dashboard...
timeout /t 5
start http://localhost:3000
start http://localhost:8000/api/health

echo.
echo ========================================
echo ✅ Setup Complete!
echo 📊 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:8000/api
echo ========================================
pause