Write-Host "Creating .env file for Google OAuth setup..." -ForegroundColor Green
Write-Host ""

$envContent = @"
# Google OAuth Credentials
# Get these from Google Cloud Console: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Session Secret
SESSION_SECRET=playkers-booking-secret-key-2024

# Server Configuration
PORT=5000
NODE_ENV=development
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Go to https://console.cloud.google.com/" -ForegroundColor White
Write-Host "   2. Create a new project or select existing one" -ForegroundColor White
Write-Host "   3. Enable Google Identity API" -ForegroundColor White
Write-Host "   4. Create OAuth 2.0 credentials" -ForegroundColor White
Write-Host "   5. Replace the placeholder values in .env file" -ForegroundColor White
Write-Host "   6. Restart the server with: npm start" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue" 