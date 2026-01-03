# OAuth Setup Guide for NextAuth

## Overview
This guide will help you set up GitHub and Google OAuth authentication for your application.

## 1. GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your App Name
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy the **Client Secret**

### Step 2: Add to .env.local
```bash
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
```

## 2. Google OAuth Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

### Step 2: Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the OAuth consent screen if prompted:
   - User Type: External
   - App name: Your App Name
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
4. Create OAuth client ID:
   - Application type: Web application
   - Name: Your App Name
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret**

### Step 3: Add to .env.local
```bash
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

## 3. NextAuth Secret

Generate a random secret for NextAuth:

```bash
openssl rand -base64 32
```

Add to .env.local:
```bash
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000
```

## 4. Production Setup

For production, update the callback URLs:
- GitHub: `https://yourdomain.com/api/auth/callback/github`
- Google: `https://yourdomain.com/api/auth/callback/google`

And update your .env:
```bash
NEXTAUTH_URL=https://yourdomain.com
```

## Features Enabled

✅ Email/Password Authentication
✅ GitHub OAuth
✅ Google OAuth
✅ Guest Mode
✅ Modern UI with dark theme
✅ Smooth animations and transitions

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/login` or `/register`
3. Try signing in with:
   - Email and password
   - GitHub account
   - Google account

## Troubleshooting

### "OAuth callback URL mismatch"
- Ensure your callback URLs in GitHub/Google match exactly
- Check that NEXTAUTH_URL is set correctly

### "Client ID or Secret invalid"
- Double-check your credentials in .env.local
- Ensure there are no extra spaces or quotes

### "Failed to sign in"
- Check server logs for detailed error messages
- Verify your database is running and accessible
