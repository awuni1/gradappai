# 🔐 OAuth Production Setup Guide for GradAppAI.com

## 🚨 **CRITICAL FIXES NEEDED FOR PRODUCTION**

Your Google OAuth is not working because of configuration mismatches between development and production. Here's what you need to fix:

---

## 1. **Update Supabase Project Settings**

### Go to your Supabase Dashboard:
1. Navigate to: https://supabase.com/dashboard/projects/[YOUR_PROJECT_ID]/auth/settings
2. Update these settings:

**Site URL:**
```
https://www.gradappai.com
```

**Additional Redirect URLs (add these):**
```
https://www.gradappai.com/auth/callback
https://gradappai.com/auth/callback
https://www.gradappai.com/**
https://gradappai.com/**
```

---

## 2. **Google Cloud Console Configuration**

### Update Google OAuth Client:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Update **Authorized redirect URIs**:

```
https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
https://www.gradappai.com/auth/callback
https://gradappai.com/auth/callback
```

**Replace `[YOUR_SUPABASE_PROJECT_ID]` with your actual Supabase project ID**

---

## 3. **Environment Variables Update**

### Create `.env.production` file:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Production URLs
VITE_APP_URL=https://www.gradappai.com
VITE_API_URL=https://www.gradappai.com/api

# OAuth Providers
VITE_GOOGLE_OAUTH_ENABLED=true
VITE_GITHUB_OAUTH_ENABLED=true

# Feature Flags
VITE_ENVIRONMENT=production
```

---

## 4. **Verify Supabase Configuration**

### Check your supabase/config.toml file should have:
```toml
[auth]
site_url = "https://www.gradappai.com"
additional_redirect_urls = [
  "https://www.gradappai.com/auth/callback",
  "https://gradappai.com/auth/callback"
]

[auth.external.google]
enabled = true
client_id = "your_google_client_id"
secret = "your_google_client_secret"
redirect_uri = "https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback"

[auth.external.github]
enabled = true
client_id = "your_github_client_id"
secret = "your_github_client_secret"
redirect_uri = "https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback"
```

---

## 5. **Domain Configuration Steps**

### A. **Add your domain to Google Search Console** (if not already done):
1. Go to: https://search.google.com/search-console
2. Add property: `https://www.gradappai.com`
3. Verify domain ownership

### B. **Update DNS if needed**:
Make sure both `gradappai.com` and `www.gradappai.com` point to your hosting provider.

---

## 6. **Testing OAuth Flow**

### After making changes, test:

1. **Google OAuth Test:**
   - Go to: https://www.gradappai.com
   - Click "Sign in with Google"
   - Should redirect to Google → back to your app

2. **Check Network Tab:**
   - Look for any CORS errors
   - Verify redirect URLs match exactly

3. **Console Debugging:**
   - Check browser console for errors
   - Look for authentication callback errors

---

## 7. **Common Issues & Solutions**

### ❌ **"redirect_uri_mismatch" Error**
- **Cause:** Google redirect URI doesn't match Supabase
- **Fix:** Update Google Console redirect URIs (Step 2)

### ❌ **CORS Policy Error**
- **Cause:** Supabase site URL doesn't match your domain
- **Fix:** Update Supabase site URL (Step 1)

### ❌ **"Invalid redirect URL" Error**
- **Cause:** Supabase redirect URLs not configured
- **Fix:** Add all redirect URLs in Supabase (Step 1)

### ❌ **OAuth popup blocked**
- **Cause:** Browser popup blocker
- **Fix:** Use redirect method instead of popup

---

## 8. **Deployment Checklist**

### ✅ **Before Deploying:**
- [ ] Update Supabase site URL to production domain
- [ ] Add all redirect URLs to Supabase
- [ ] Update Google OAuth redirect URIs
- [ ] Create `.env.production` file
- [ ] Test OAuth flow in staging environment
- [ ] Verify SSL certificate is working
- [ ] Check domain DNS configuration

### ✅ **After Deploying:**
- [ ] Test Google sign-in on production
- [ ] Test GitHub sign-in on production  
- [ ] Monitor error logs for OAuth issues
- [ ] Test user registration flow
- [ ] Verify email confirmations work

---

## 9. **Monitoring & Debugging**

### **Production Debugging:**
```javascript
// Add this to your browser console on production:
console.log('Current URL:', window.location.origin);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Check OAuth configuration:
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
}).then(result => console.log('OAuth result:', result));
```

### **Log Monitoring:**
- Check Supabase Auth logs
- Monitor your hosting provider logs
- Use browser DevTools Network tab

---

## 10. **Security Considerations**

### **Production Security:**
- Always use HTTPS
- Keep OAuth secrets secure
- Regular security audits
- Monitor failed authentication attempts
- Implement rate limiting

---

## 🚀 **Quick Fix Checklist**

**Do these steps RIGHT NOW:**

1. **Go to Supabase Dashboard** → Auth → Settings
   - Change Site URL to: `https://www.gradappai.com`

2. **Go to Google Cloud Console** → Credentials
   - Add redirect URI: `https://[YOUR_SUPABASE_ID].supabase.co/auth/v1/callback`

3. **Test immediately** after changes

4. **If still not working**, check the browser console for specific errors

---

Need help? The most common issue is the redirect URI mismatch. Double-check that your Google OAuth client has the exact Supabase callback URL.
