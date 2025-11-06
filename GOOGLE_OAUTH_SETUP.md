# Google OAuth Setup Guide

Follow these steps to set up real Google OAuth authentication for your PLAYKERS BOOKING application.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `playkers-booking`
4. Click "Create"

## Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google Identity" and "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: PLAYKERS BOOKING
   - User support email: your-email@gmail.com
   - Developer contact information: your-email@gmail.com
   - Save and Continue

4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: PLAYKERS BOOKING Web Client
   - Authorized JavaScript origins:
     ```
     http://localhost:5000
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:5000/auth/google/callback
     ```
   - Click "Create"

5. **Copy the Client ID and Client Secret** (you'll need these in the next step)

## Step 4: Create Environment File

1. Create a `.env` file in your project root:
   ```
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   SESSION_SECRET=your-session-secret-here
   ```

2. Replace the values with your actual credentials from Step 3

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Start the Server

```bash
npm start
```

## Step 7: Test Google OAuth

1. Open `http://localhost:5000/login.html`
2. Click "Sign in with Google"
3. You should be redirected to Google's OAuth consent screen
4. Sign in with your Google account
5. Grant permissions to your app
6. You should be redirected back to your application

## Troubleshooting

### Error: "OAuth client was not found"
- Check that your Client ID and Client Secret are correct in `.env`
- Verify the redirect URI matches exactly: `http://localhost:5000/auth/google/callback`

### Error: "redirect_uri_mismatch"
- Go to Google Cloud Console → Credentials → OAuth 2.0 Client IDs
- Edit your client and add the exact redirect URI

### Error: "invalid_client"
- Make sure your `.env` file exists and has the correct credentials
- Restart the server after updating `.env`

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables in production
- Set up proper session management for production
- Use HTTPS in production

## Production Deployment

When deploying to production:
1. Update redirect URIs in Google Cloud Console
2. Use environment variables for credentials
3. Set up proper session storage (Redis, database)
4. Enable HTTPS
5. Update CORS settings for your domain 