@echo off
title Twitch Task Bot System

echo.
echo 🚀 Starting Twitch Task Bot System...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm found
npm --version

echo.
echo 📦 Installing dependencies...

REM Install backend dependencies
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
) else (
    echo ✅ Backend dependencies already installed
)

REM Install bot dependencies
if not exist "bot\node_modules" (
    echo Installing bot dependencies...
    cd bot
    call npm install
    cd ..
) else (
    echo ✅ Bot dependencies already installed
)

REM Install overlay dependencies
if not exist "overlay\node_modules" (
    echo Installing overlay dependencies...
    cd overlay
    call npm install
    cd ..
) else (
    echo ✅ Overlay dependencies already installed
)

echo.
echo 🔧 Starting services...

REM Start backend in new window
echo Starting backend server...
start "Task Bot Backend" cmd /k "cd backend && npm run dev"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start bot in new window
echo Starting Twitch bot...
start "Task Bot" cmd /k "cd bot && npm run dev"

REM Wait for bot to start
timeout /t 2 /nobreak >nul

REM Start overlay in new window
echo Starting React overlay...
start "Task Overlay" cmd /k "cd overlay && npm start"

echo.
echo 🎉 All services are starting...
echo.
echo 📋 Service Information:
echo    Backend API: http://localhost:3001
echo    React Overlay: http://localhost:3000
echo    Bot: Connected to Twitch chat
echo.
echo 🎮 Available Commands:
echo    !add [task]       - Add a new task
echo    !edit [id] [text] - Edit your task  
echo    !done [id]        - Mark task as complete
echo    !mytasks          - List your tasks
echo    !taskhelp         - Show help
echo.
echo 🎬 OBS Setup:
echo    1. Add Browser Source
echo    2. URL: http://localhost:3000
echo    3. Width: 450px, Height: 800px
echo.
echo ✅ Setup complete! Check the opened windows for each service.
echo.
pause