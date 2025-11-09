# 🚀 Quick Netlify Setup - 5 Minutes to Live!

## Step 1: Add Build Script (IMPORTANT!)

Open your `package.json` and add these lines to the "scripts" section:

```json
"build": "expo export -p web",
"build:web": "expo export -p web",
```

Your scripts section should look like:
```json
"scripts": {
  "start": "expo start",
  "start:web": "expo start --web",
  "build": "expo export -p web",
  "build:web": "expo export -p web",
  "lint": "expo lint"
}
```

## Step 2: Deploy to Netlify

### Option 1: Using Netlify Dashboard (Easiest - 3 clicks!)

1. **Go to** [https://app.netlify.com](https://app.netlify.com)
2. **Click** "Add new site" → "Import an existing project"
3. **Connect** your Git repository (GitHub/GitLab)
4. **Configure:**
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Add Environment Variables** (click "Show advanced"):
   ```
   EXPO_PUBLIC_SUPABASE_URL = [Your Supabase URL]
   EXPO_PUBLIC_SUPABASE_ANON_KEY = [Your Supabase Key]
   EXPO_PUBLIC_RORK_API_BASE_URL = [Your Backend URL - see below]
   ```
6. **Click** "Deploy site"

### Option 2: Using Netlify CLI (For developers)

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## Step 3: Deploy Your Backend

Your backend needs hosting separately. **Easiest option: Render.com**

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Settings:
   - **Name**: kurdish-cuisine-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `bun run start`
5. Add environment variables from `backend/.env`
6. Click "Create Web Service"
7. **Copy the URL** (looks like: `https://kurdish-cuisine-backend.onrender.com`)

## Step 4: Update Netlify with Backend URL

1. Go back to Netlify dashboard
2. Site settings → Environment variables
3. Update `EXPO_PUBLIC_RORK_API_BASE_URL` with your backend URL from Step 3
4. Click "Rebuild site"

## Step 5: Test Your Site! 🎉

Open your Netlify URL and test:
- [ ] Landing page loads
- [ ] Menu displays items
- [ ] Can navigate between pages
- [ ] Kitchen/Cashier screens work

---

## 🔧 Files Already Created for You

✅ `netlify.toml` - Netlify configuration (already in your project)
✅ `NETLIFY_DEPLOYMENT_GUIDE.md` - Full detailed guide

---

## 🐛 Common Issues & Quick Fixes

### Issue: Site doesn't load
**Fix**: Check if build completed successfully in Netlify dashboard

### Issue: Environment variables not working
**Fix**: Make sure they start with `EXPO_PUBLIC_` and rebuild site

### Issue: Backend connection fails
**Fix**: Verify `EXPO_PUBLIC_RORK_API_BASE_URL` is correct

### Issue: Routes return 404
**Fix**: The `netlify.toml` file handles this automatically

---

## 📊 Your Deployment Checklist

Before going live:
- [ ] Added build scripts to package.json
- [ ] Pushed code to Git
- [ ] Connected to Netlify
- [ ] Added environment variables
- [ ] Backend is deployed and running
- [ ] Updated backend URL in Netlify
- [ ] Site builds successfully
- [ ] All features work on live site

---

## 💡 Pro Tips

1. **Custom Domain**: Add your domain in Netlify → Domain settings
2. **Auto Deploy**: Every git push automatically updates your site
3. **Preview Deploys**: Every pull request gets a preview URL
4. **Free HTTPS**: Automatically enabled by Netlify
5. **CDN**: Your site is fast worldwide

---

## 📞 Need Help?

Check the full guide: `NETLIFY_DEPLOYMENT_GUIDE.md`

---

## 🎯 What You Get

- ✅ Live website accessible worldwide
- ✅ HTTPS (secure) automatically
- ✅ Auto-deployment on git push
- ✅ Free hosting (100GB bandwidth/month)
- ✅ Fast CDN delivery
- ✅ Zero downtime updates

---

**Ready to go live? Let's do this! 🚀**
