# PLAYKERS BOOKING - Google OAuth Setup

This project includes Google OAuth authentication for the login system.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Google OAuth Configuration

To use Google OAuth, you need to set up a Google Cloud Project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set the application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5500/auth/google/callback`
7. Copy the Client ID and Client Secret

### 3. Environment Variables

Create a `.env` file in the root directory:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Start the Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### 5. Test the Application

1. Open `http://localhost:5000` in your browser
2. Navigate to the login page
3. Click "Sign in with Google" to test the OAuth flow

## Available Routes

- `GET /` - Home page
- `GET /login` - Login page
- `GET /signup` - Signup page
- `POST /api/login` - Regular login endpoint
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback

## Notes

- The server includes CORS configuration for cross-origin requests
- Sessions are configured for development (not secure for production)
- User data is currently stored in memory (should be replaced with a database in production) 