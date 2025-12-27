# 🚀 Vercel Deployment Guide

Complete guide to deploy this Next.js project on Vercel with custom domain configuration.

## 📋 Prerequisites

- [x] GitHub account with project repository
- [x] Vercel account (free tier is sufficient)
- [x] Custom domain name (optional but recommended)
- [x] Supabase project with credentials

## 🔧 Step 1: Prepare Environment Variables

### Required Environment Variables

Create these in Vercel dashboard (you already have them in `.env.local`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Secret (for authentication)
JWT_SECRET=your-secret-key

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@yourdomain.com

# Application URL (will be updated after deployment)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🌐 Step 2: Deploy to Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Login" and connect with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your GitHub repository: `StrucTech/Rawaby-Website`
   - Click "Import"

3. **Configure Project**
   ```
   Framework Preset: Next.js
   Root Directory: ./khadamat-taalimia (if needed)
   Build Command: npm run build (default)
   Output Directory: .next (default)
   Install Command: npm install (default)
   ```

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all variables from `.env.local` (see list above)
   - **Important**: Don't include `NEXT_PUBLIC_APP_URL` yet

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `https://your-project.vercel.app`

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## 🌍 Step 3: Add Custom Domain

### Option A: Domain Purchased from Vercel

1. Go to your project → Settings → Domains
2. Click "Add Domain"
3. Search and purchase domain directly
4. Vercel auto-configures DNS

### Option B: External Domain (Namecheap, GoDaddy, etc.)

#### 1. Add Domain in Vercel
- Go to: Project → Settings → Domains
- Enter your domain: `yourdomain.com`
- Click "Add"

#### 2. Configure DNS Records

Vercel will show you records to add. Add these in your domain registrar:

**For Root Domain (yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**For WWW Subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Example for Popular Registrars:**

**Namecheap:**
1. Domain List → Manage → Advanced DNS
2. Add/Modify A Record: `@` → `76.76.21.21`
3. Add CNAME Record: `www` → `cname.vercel-dns.com`

**GoDaddy:**
1. DNS Management
2. Add A Record: `@` → `76.76.21.21`
3. Add CNAME: `www` → `cname.vercel-dns.com`

**Cloudflare:**
1. DNS → Add Record
2. A Record: `@` → `76.76.21.21` (Proxy status: ON)
3. CNAME: `www` → `cname.vercel-dns.com` (Proxy: ON)

#### 3. Wait for DNS Propagation
- Usually takes 5-10 minutes
- Can take up to 48 hours in rare cases
- Check status: https://dnschecker.org

## 🔒 Step 4: Update Environment Variables

After domain is connected:

1. Go to: Project → Settings → Environment Variables
2. Add/Update:
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   EMAIL_FROM=noreply@yourdomain.com
   ```
3. Redeploy: Deployments → Latest → "Redeploy"

## 📧 Step 5: Configure Email (Important!)

### Update Email Settings for Production

If using Gmail/Google Workspace:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Use App Password, not regular password
```

**Get Gmail App Password:**
1. Google Account → Security
2. 2-Step Verification (must be enabled)
3. App passwords → Generate

For other providers (SendGrid, Mailgun, etc.), check their SMTP docs.

## 🗄️ Step 6: Configure Supabase

### Update Supabase Settings for Production

1. **Site URL**
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `https://yourdomain.com`

2. **Redirect URLs**
   Add these to "Redirect URLs":
   ```
   https://yourdomain.com/*
   https://yourdomain.com/api/auth/callback
   https://*.vercel.app/*  (for preview deployments)
   ```

3. **CORS**
   - API Settings → Add your domain to CORS allowed origins

4. **Storage (for contracts/files)**
   - Ensure buckets have correct policies
   - Test file uploads after deployment

## ✅ Step 7: Verify Deployment

### Test These Features:

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] Email verification is sent
- [ ] Login/logout functions
- [ ] Services page displays data from Supabase
- [ ] Cart and payment flow works
- [ ] Admin dashboard is accessible
- [ ] File uploads (contracts) work
- [ ] Arabic text displays correctly
- [ ] All API routes respond

### Common Issues & Solutions

**Issue 1: Environment Variables Not Working**
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)
- Don't add quotes around values in Vercel

**Issue 2: Supabase Connection Fails**
- Verify URLs and keys are correct
- Check Supabase project is not paused (free tier)
- Ensure CORS is configured

**Issue 3: Email Not Sending**
- Verify SMTP credentials
- Check email provider allows SMTP
- For Gmail, use App Password
- Check Vercel logs for errors

**Issue 4: Domain Not Connecting**
- Wait 24-48 hours for DNS propagation
- Clear browser cache
- Try incognito mode
- Use https://dnschecker.org to verify

**Issue 5: Build Fails**
- Check Vercel build logs
- Ensure all dependencies in package.json
- Try local build: `npm run build`

## 🔍 Monitor Your Deployment

### Vercel Dashboard Tools:

1. **Analytics** - Traffic and performance
2. **Logs** - Real-time server logs
3. **Deployments** - History and rollback
4. **Speed Insights** - Performance metrics

### View Logs:
```bash
# Using CLI
vercel logs your-project-url

# Or in dashboard: Project → Deployments → View Function Logs
```

## 🚀 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

- `main` branch → Production
- Other branches → Preview deployments

**Disable auto-deploy:**
Project → Settings → Git → Configure

## 💰 Cost Considerations

### Vercel Free Tier Limits:
- ✅ Unlimited personal/hobby projects
- ✅ 100GB bandwidth/month
- ✅ Custom domain
- ✅ SSL certificate (free)
- ✅ Serverless functions

### When to Upgrade:
- Need more than 100GB bandwidth
- Need team collaboration
- Need advanced analytics
- Need password protection

### Alternative Deployment Options:

If Vercel doesn't fit:
1. **Netlify** - Similar to Vercel
2. **Railway** - Good for full-stack apps
3. **DigitalOcean App Platform** - More control
4. **Self-hosted VPS** - Full control but needs DevOps

## 🔐 Security Checklist

After deployment:

- [ ] Change all default passwords
- [ ] Rotate JWT_SECRET
- [ ] Enable Supabase RLS policies
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerts
- [ ] Enable HTTPS only (Vercel default)
- [ ] Add security headers in next.config.mjs

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase with Vercel](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Custom Domain Guide](https://vercel.com/docs/concepts/projects/domains)

## 🆘 Need Help?

- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/next.js/discussions
- **Check build logs** for specific error messages

---

**Last Updated:** December 27, 2025
**Project:** Khadamat Taalimia - Educational Services Platform
**Repository:** https://github.com/StrucTech/Rawaby-Website
