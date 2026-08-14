@echo off
cd /d "%~dp0"
echo.
echo =========================================
echo   SMARTY ENGLISH — Firebase Deploy
echo =========================================
echo.

echo [1/3] Logging in to Firebase...
firebase login
if %errorlevel% neq 0 (
  echo ERROR: Login failed. Please try again.
  pause
  exit /b 1
)

echo.
echo [2/3] Building the app...
call npm run build
if %errorlevel% neq 0 (
  echo ERROR: Build failed. Check the output above.
  pause
  exit /b 1
)

echo.
echo [3/3] Deploying to Firebase Hosting...
firebase deploy --only hosting
if %errorlevel% neq 0 (
  echo ERROR: Deploy failed. Check the output above.
  pause
  exit /b 1
)

echo.
echo =========================================
echo   SUCCESS! Your app is live.
echo =========================================
echo   Visit: https://smarty-english-c0532.web.app
echo =========================================
echo.
pause
