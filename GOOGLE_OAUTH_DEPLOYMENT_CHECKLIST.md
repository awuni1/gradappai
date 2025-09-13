# 🚀 **Google OAuth Production Deployment Checklist**

## ✅ **Quick Fix Steps (Do These First)**

### 1. **Update Supabase Dashboard Settings**
- [ ] Go to your Supabase project dashboard
- [ ] Navigate to **Authentication > Settings**
- [ ] Update **Site URL** to: `https://your-production-domain.com`
- [ ] Add **Additional redirect URLs**:
  ```
  https://your-production-domain.com/**
  https://your-production-domain.com/auth/callback
  ```

### 2. **Configure Google Cloud Console**
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Navigate to **APIs & Services > Credentials**
- [ ] Find your OAuth 2.0 Client ID
- [ ] Add **Authorized redirect URIs**:
  ```
  https://knjcvoyjyrsyivywufqw.supabase.co/auth/v1/callback
  https://your-production-domain.com/auth/callback
  ```
- [ ] Add **Authorized JavaScript origins**:
  ```
  https://your-production-domain.com
  ```

### 3. **Enable Google Provider in Supabase**
- [ ] Go to **Authentication > Providers**
- [ ] Enable **Google** provider
- [ ] Add your **Google OAuth Client ID**
- [ ] Add your **Google OAuth Client Secret**

## 🔧 **Detailed Configuration Steps**

### **Google Cloud Console Setup**

1. **Create/Select Project**
   - Go to Google Cloud Console
   - Create new project or select existing
   - Project ID: `gradapp-production` (or your choice)

2. **Enable Required APIs**
   - [ ] Google+ API
   - [ ] Google OAuth2 API
   - [ ] People API (optional but recommended)

3. **OAuth Consent Screen**
   - [ ] App name: "GradApp"
   - [ ] User support email: your-email@domain.com
   - [ ] Developer contact: your-email@domain.com
   - [ ] Authorized domains: your-production-domain.com

4. **OAuth 2.0 Credentials**
   ```
   Application type: Web application
   Name: GradApp Production
   
   Authorized JavaScript origins:
   - https://your-production-domain.com
   - https://knjcvoyjyrsyivywufqw.supabase.co
   
   Authorized redirect URIs:
   - https://knjcvoyjyrsyivywufqw.supabase.co/auth/v1/callback
   - https://your-production-domain.com/auth/callback
   ```

### **Supabase Configuration**

1. **Authentication Settings**
   ```
   Site URL: https://your-production-domain.com
   Additional redirect URLs: 
   - https://your-production-domain.com/**
   - https://your-production-domain.com/auth/callback
   ```

2. **Google Provider**
   ```
   Enabled: ✅
   Client ID: [Your Google OAuth Client ID]
   Client Secret: [Your Google OAuth Client Secret]
   ```

### **Hosting Platform Setup**

#### **For Netlify:**
```bash
# Environment Variables
VITE_SUPABASE_URL=https://knjcvoyjyrsyivywufqw.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Build Settings
Build command: npm run build
Publish directory: dist
```

#### **For Vercel:**
```bash
# Environment Variables
VITE_SUPABASE_URL=https://knjcvoyjyrsyivywufqw.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Build Settings
Framework: Vite
Build command: npm run build
Output directory: dist
```

## 🧪 **Testing Checklist**

### **Before Going Live:**
- [ ] Test Google sign-in on staging/preview URL
- [ ] Verify redirect URLs work correctly
- [ ] Check that user profile is created after OAuth
- [ ] Test both sign-in and sign-up flows
- [ ] Verify email/avatar data is populated

### **After Deployment:**
- [ ] Test Google OAuth on production domain
- [ ] Check browser console for any errors
- [ ] Verify user session persistence
- [ ] Test sign-out functionality
- [ ] Check mobile responsiveness

## 🚨 **Common Error Solutions**

### **Error: "redirect_uri_mismatch"**
```
Solution: Add your production domain to Google Console redirect URIs:
https://your-production-domain.com/auth/callback
```

### **Error: "unauthorized_client"**
```
Solution: Verify Client ID and Secret are correct in Supabase dashboard
```

### **Error: "access_blocked"**
```
Solution: Configure OAuth consent screen in Google Console
Add your domain to authorized domains
```

### **Error: "invalid_request"**
```
Solution: Check that redirect URL in code matches Google Console configuration
Verify Supabase site URL is set correctly
```

## 📋 **Final Verification Steps**

1. **Test the complete flow:**
   ```
   1. Click "Sign in with Google"
   2. Google popup appears
   3. User selects Google account
   4. Redirects to /auth/callback
   5. AuthCallback processes the session
   6. User lands on dashboard
   ```

2. **Check user data:**
   ```
   - User profile is created in Supabase
   - Email, name, and avatar are populated
   - Session is properly established
   - Redirect to correct dashboard based on role
   ```

## 🔐 **Security Best Practices**

- [ ] Use HTTPS for all redirect URIs
- [ ] Set up proper CORS headers
- [ ] Implement rate limiting on auth endpoints
- [ ] Use secure session management
- [ ] Set up monitoring and error tracking

## 📞 **Need Help?**

If Google OAuth still doesn't work after following this checklist:

1. Check the browser console for error messages
2. Verify all URLs match exactly (no trailing slashes, correct protocols)
3. Test on incognito/private browsing mode
4. Clear browser cache and cookies
5. Check Supabase project logs for auth errors

---

**⚠️ Replace all placeholder values with your actual:**
- Domain name
- Google OAuth credentials
- Supabase project details
