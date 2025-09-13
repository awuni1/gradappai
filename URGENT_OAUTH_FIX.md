# 🚨 URGENT OAuth Fixes for GradAppAI.com

## Current Issue Analysis:
Based on your screenshots, here are the exact issues and fixes:

## ✅ **Step 1: Fix Google Console Redirect URIs**

In your Google Console (console.cloud.google.com), update the **Authorized redirect URIs** to:

```
https://knjcvoyjyrsyivywufqw.supabase.co/auth/v1/callback
https://gradappai.com/auth/callback
https://www.gradappai.com/auth/callback
```

**⚠️ CRITICAL:** Make sure the first URL is exactly `https://knjcvoyjyrsyivywufqw.supabase.co/auth/v1/callback` (this is your Supabase project callback)

## ✅ **Step 2: Update Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/projects/knjcvoyjyrsyivywufqw/auth/settings
2. Set **Site URL** to: `https://www.gradappai.com`
3. Add **Additional redirect URLs**:
   ```
   https://www.gradappai.com/auth/callback
   https://gradappai.com/auth/callback
   https://www.gradappai.com/**
   https://gradappai.com/**
   ```

## ✅ **Step 3: Verify Google Provider is Enabled**

1. Go to: https://supabase.com/dashboard/projects/knjcvoyjyrsyivywufqw/auth/providers
2. Make sure **Google** provider is enabled
3. Enter your Google OAuth **Client ID** and **Client Secret**

## ✅ **Step 4: Test Your Configuration**

### Method 1: Use Debug Tool
1. Upload the `debug-oauth-test.html` file to your website
2. Visit: `https://www.gradappai.com/debug-oauth-test.html`
3. Click "Test Google OAuth"

### Method 2: Test Production Site
1. Go to: `https://www.gradappai.com`
2. Try signing in with Google
3. Check browser console for any errors

## 🐛 **Common Errors and Solutions:**

### Error: "redirect_uri_mismatch"
- **Cause:** Google Console redirect URI doesn't match Supabase exactly
- **Fix:** Ensure `https://knjcvoyjyrsyivywufqw.supabase.co/auth/v1/callback` is in Google Console

### Error: "Invalid redirect URL" 
- **Cause:** Supabase doesn't allow your production domain
- **Fix:** Add `https://www.gradappai.com/auth/callback` to Supabase redirect URLs

### Error: "CORS policy" or "blocked"
- **Cause:** Supabase site URL doesn't match your domain  
- **Fix:** Set Supabase site URL to `https://www.gradappai.com`

### Error: Connection refused (localhost:5173)
- **Cause:** Your app is trying to redirect to localhost instead of production
- **Fix:** This should be fixed by the code changes I made

## 🎯 **Quick Verification:**

After making the changes above, the OAuth flow should work like this:

1. User clicks "Sign in with Google" on `https://www.gradappai.com`
2. Redirects to Google sign-in
3. Google redirects to: `https://knjcvoyjyrsyivywufqw.supabase.co/auth/v1/callback`
4. Supabase processes the OAuth and redirects to: `https://www.gradappai.com/auth/callback`
5. Your `AuthCallback` component handles the final redirect

## ⏱️ **Important Notes:**
- Changes in Google Console can take 5-60 minutes to propagate
- Clear your browser cache after making changes
- Test in incognito mode to avoid cached redirects
- Check both browser console and network tab for detailed errors

## 🆘 **If Still Not Working:**
1. Share the exact error message from browser console
2. Check the Network tab in Developer Tools when testing OAuth
3. Verify your Google OAuth Client ID and Secret are correctly entered in Supabase
