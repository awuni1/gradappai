# Google OAuth Setup Guide for Production

## 🚨 **Critical Steps to Fix Google Sign-In**

### 1. **Google Cloud Console Configuration**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google OAuth2 API"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "GradApp Production"

5. **Add Authorized Redirect URIs** (CRITICAL):
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   https://yourdomain.com/auth/callback
   https://yourdomain.netlify.app/auth/callback  (if using Netlify)
   https://yourdomain.vercel.app/auth/callback   (if using Vercel)
   ```

6. **Add Authorized JavaScript Origins**:
   ```
   https://yourdomain.com
   https://yourdomain.netlify.app
   https://yourdomain.vercel.app
   ```

### 2. **Supabase Dashboard Configuration**

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret

### 3. **Update Site URL in Supabase**

1. Go to Authentication > Settings
2. Update **Site URL** to your production domain:
   ```
   https://yourdomain.com
   ```
3. Add **Additional redirect URLs**:
   ```
   https://yourdomain.com/**
   https://yourdomain.com/auth
   https://yourdomain.com/auth/callback
   ```

### 4. **Environment Variables** (if using)

Add to your environment variables:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. **Code Updates Required**

Update your auth redirect URL in the code to match production:

```typescript
// In authService.ts - Update the redirectTo URL
async signInWithGoogle(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // Updated
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}
```

### 6. **Create OAuth Callback Handler**

Create a dedicated callback page to handle OAuth returns:

1. Create `src/pages/AuthCallback.tsx`
2. Add route handling for `/auth/callback`

### 7. **Common Error Messages and Solutions**

- **"redirect_uri_mismatch"**: Check your Google Console redirect URIs
- **"unauthorized_client"**: Verify your client ID and secret in Supabase
- **"access_blocked"**: Check your Google OAuth consent screen configuration
- **"invalid_request"**: Usually a configuration mismatch

### 8. **Testing Checklist**

- [ ] Google OAuth credentials created
- [ ] Redirect URIs added to Google Console
- [ ] Google provider enabled in Supabase
- [ ] Site URL updated in Supabase
- [ ] Code updated with production URLs
- [ ] OAuth callback page created
- [ ] Domain whitelisted in Google Console

## 🔧 **Immediate Fix Required:**

The most critical issue is likely that your Supabase redirect URL doesn't match what's configured in Google Console.
