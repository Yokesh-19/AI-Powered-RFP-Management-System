@echo off
echo ========================================
echo Git Repository Setup
echo ========================================
echo.

REM Initialize Git repository
echo [1/5] Initializing Git repository...
git init
echo.

REM Add all files
echo [2/5] Adding files to Git...
git add .
echo.

REM Create initial commit
echo [3/5] Creating initial commit...
git commit -m "Initial commit: AI-Powered RFP Management System"
echo.

REM Add remote (replace with your GitHub repo URL)
echo [4/5] Adding remote repository...
echo Please create a repository on GitHub first, then run:
echo git remote add origin https://github.com/YOUR_USERNAME/rfp-management-system.git
echo.

REM Push to GitHub
echo [5/5] To push to GitHub, run:
echo git branch -M main
echo git push -u origin main
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create a new repository on GitHub
echo 2. Run: git remote add origin YOUR_REPO_URL
echo 3. Run: git branch -M main
echo 4. Run: git push -u origin main
echo.
pause
