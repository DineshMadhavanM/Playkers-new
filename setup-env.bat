@echo off
echo Creating .env file for Google OAuth setup...
echo.

echo # Google OAuth Credentials > .env
echo # Get these from Google Cloud Console: https://console.cloud.google.com/ >> .env
echo GOOGLE_CLIENT_ID=your-google-client-id-here >> .env
echo GOOGLE_CLIENT_SECRET=your-google-client-secret-here >> .env
echo. >> .env
echo # Session Secret >> .env
echo SESSION_SECRET=playkers-booking-secret-key-2024 >> .env
echo. >> .env
echo # Server Configuration >> .env
echo PORT=5000 >> .env
echo NODE_ENV=development >> .env

echo ✅ .env file created successfully!
echo.
echo 📝 Next steps:
echo    1. Go to https://console.cloud.google.com/
echo    2. Create a new project or select existing one
echo    3. Enable Google Identity API
echo    4. Create OAuth 2.0 credentials
echo    5. Replace the placeholder values in .env file
echo    6. Restart the server with: npm start
echo.
pause 