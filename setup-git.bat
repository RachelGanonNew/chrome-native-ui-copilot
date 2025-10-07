@echo off
echo Setting up Git repository...

git init
git add .
git commit -m "Initial commit: Chrome Native UI Copilot extension"

echo.
echo Next steps:
echo 1. Create repository on GitHub: https://github.com/new
echo 2. Run: git remote add origin https://github.com/YOUR_USERNAME/chrome-native-ui-copilot.git
echo 3. Run: git push -u origin main
echo.
pause