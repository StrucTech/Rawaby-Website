# ✅ Vercel Deployment Checklist

Quick reference for deploying to Vercel. Follow in order:

## 🔧 Pre-Deployment (Do Once)

- [ ] Project builds locally: `npm run build`
- [ ] All environment variables documented
- [ ] Supabase project is active and accessible
- [ ] Email SMTP credentials ready
- [ ] GitHub repository is up to date

## 🚀 Deployment Steps

### 1. Create Vercel Project
- [ ] Go to https://vercel.com/new
- [ ] Import `StrucTech/Rawaby-Website` from GitHub
- [ ] Select root directory: `khadamat-taalimia`
- [ ] Keep default build settings

### 2. Add Environment Variables
Copy from `.env.local` and add in Vercel:

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ JWT_SECRET
✓ EMAIL_HOST
✓ EMAIL_PORT
✓ EMAIL_USER
✓ EMAIL_PASSWORD
✓ EMAIL_FROM
```

**Don't add yet:** `NEXT_PUBLIC_APP_URL` (add after domain setup)

### 3. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build (2-3 min)
- [ ] Note your Vercel URL: `https://______.vercel.app`

### 4. Connect Custom Domain

#### If you have a domain:
- [ ] Go to: Project → Settings → Domains
- [ ] Click "Add Domain"
- [ ] Enter: `yourdomain.com`
- [ ] Copy DNS records shown by Vercel

#### Configure DNS (at your registrar):
- [ ] Add A Record: `@` → `76.76.21.21`
- [ ] Add CNAME: `www` → `cname.vercel-dns.com`
- [ ] Wait 10-30 minutes for DNS propagation
- [ ] Check: https://dnschecker.org

### 5. Update Production URLs
- [ ] Add `NEXT_PUBLIC_APP_URL=https://yourdomain.com` to Vercel env vars
- [ ] Update `EMAIL_FROM=noreply@yourdomain.com`
- [ ] Redeploy: Deployments → Latest → "Redeploy"

### 6. Configure Supabase
Go to Supabase Dashboard:

- [ ] Authentication → URL Configuration → Site URL: `https://yourdomain.com`
- [ ] Add redirect URL: `https://yourdomain.com/*`
- [ ] Add redirect URL: `https://*.vercel.app/*`
- [ ] API Settings → CORS: Add your domain

### 7. Test Deployment

Visit your site and test:
- [ ] Homepage loads
- [ ] User registration works
- [ ] Email is sent (check spam folder)
- [ ] Login/logout works
- [ ] Services load from database
- [ ] Admin dashboard accessible
- [ ] Arabic text displays correctly
- [ ] File uploads work

## 🐛 Troubleshooting

**Build fails:**
```bash
# Test locally first
npm run build
```

**Environment variables not working:**
- Redeploy after adding variables
- Check spelling/case
- Don't use quotes in Vercel

**Domain not connecting:**
- Wait 24 hours
- Clear browser cache
- Check DNS: https://dnschecker.org

**Email not sending:**
- Use App Password for Gmail
- Check Vercel logs for errors
- Verify SMTP settings

**Supabase errors:**
- Check URLs are correct
- Verify project not paused
- Confirm CORS settings

## 📊 After Deployment

- [ ] Monitor in Vercel dashboard
- [ ] Check error logs daily (first week)
- [ ] Set up monitoring/alerts
- [ ] Update README with live URL
- [ ] Test on mobile devices
- [ ] Test on different browsers

## 🔐 Security

- [ ] Rotate JWT_SECRET
- [ ] Enable Supabase RLS policies
- [ ] Review user permissions
- [ ] Set up rate limiting
- [ ] Monitor unusual activity

## 📱 Share URLs

**Production:**
`https://yourdomain.com`

**Admin Dashboard:**
`https://yourdomain.com/admin`

**API Health:**
`https://yourdomain.com/api/health` (if you add it)

---

✅ **Deployment Complete!** 

Next: Monitor performance and user feedback for the first week.
