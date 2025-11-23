# Deployment Guide - Render.com

This guide will help you deploy the AI Hair Simulation application to Render.com.

## Prerequisites

- GitHub account with your repository pushed
- Render.com account (free tier works)
- Firebase project set up
- Replicate API token for NanoBanana AI model

---

## Step 1: Prepare Your Repository

### 1.1 Ensure all code is committed and pushed to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2 Verify these files exist:
- ✅ `server/.env.example` - Backend environment variables template
- ✅ `client/.env.example` - Frontend environment variables template
- ✅ `package.json` - Root package.json with build scripts
- ✅ `.gitignore` - Ensure `.env` files are ignored

---

## Step 2: Deploy Backend (Express Server)

### 2.1 Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your `ai_hair_simulation` repository

### 2.2 Configure Web Service

**Basic Settings:**
```
Name:              ai-hair-simulation-backend
Region:            Choose closest to your users (e.g., Oregon, Singapore)
Branch:            main
Root Directory:    server
Runtime:           Node
Build Command:     npm install
Start Command:     npm start
Instance Type:     Free (or paid for better performance)
```

### 2.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

```env
NODE_ENV=production
PORT=5000

# Update this after deploying frontend (Step 3)
CLIENT_URL=https://your-frontend-url.onrender.com

# Firebase Configuration (from your Firebase Console)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key-with-newlines
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# JWT Secret (generate a random secure string)
JWT_SECRET=your-secure-random-jwt-secret-here

# Replicate API Token (from replicate.com)
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`: Keep the `\n` characters or paste the full key with line breaks
- Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- Get `REPLICATE_API_TOKEN` from your [Replicate account](https://replicate.com/account/api-tokens)

### 2.4 Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment to complete (2-5 minutes)
3. **Copy the backend URL** (e.g., `https://ai-hair-simulation-backend.onrender.com`)

---

## Step 3: Deploy Frontend (React/Vite)

### 3.1 Create Static Site on Render

1. Go back to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Static Site"**
3. Select the same `ai_hair_simulation` repository

### 3.2 Configure Static Site

**Basic Settings:**
```
Name:              ai-hair-simulation-frontend
Region:            Same as backend
Branch:            main
Root Directory:    client
Build Command:     npm install && npm run build
Publish Directory: dist
```

### 3.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

```env
# Use your backend URL from Step 2.4
VITE_API_URL=https://ai-hair-simulation-backend.onrender.com/api
```

### 3.4 Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for deployment (2-5 minutes)
3. **Copy the frontend URL** (e.g., `https://ai-hair-simulation-frontend.onrender.com`)

---

## Step 4: Update Backend CORS

Now that you have the frontend URL, update the backend:

1. Go to your **backend Web Service** on Render
2. Navigate to **"Environment"** tab
3. Find the `CLIENT_URL` variable
4. Update it with your actual frontend URL:
   ```
   CLIENT_URL=https://ai-hair-simulation-frontend.onrender.com
   ```
5. Save - the service will automatically redeploy

---

## Step 5: Verify Deployment

### 5.1 Check Backend Health

Visit: `https://your-backend-url.onrender.com/api`

You should see a JSON response or API documentation.

### 5.2 Check Frontend

Visit: `https://your-frontend-url.onrender.com`

Your React app should load properly.

### 5.3 Test Full Flow

1. Register a new user
2. Login
3. Upload an image
4. Generate hair simulation
5. Check if results are displayed

---

## Step 6: Monitor and Troubleshoot

### View Logs

**Backend Logs:**
1. Go to your backend Web Service
2. Click **"Logs"** tab
3. Monitor for errors

**Frontend Logs:**
1. Go to your Static Site
2. Click **"Logs"** tab
3. Check build logs

### Common Issues

**Issue: Backend returns 500 errors**
- Check Firebase credentials are correct
- Verify all environment variables are set
- Check logs for specific error messages

**Issue: Frontend can't connect to backend**
- Verify `VITE_API_URL` is set correctly
- Check CORS settings (CLIENT_URL)
- Ensure backend is fully deployed and running

**Issue: Images not uploading**
- Check file size limits (currently 10mb)
- Verify Replicate API token is valid
- Check temp_uploads directory permissions

**Issue: Cold starts (Free tier)**
- Free tier services spin down after 15 minutes of inactivity
- First request may take 30-60 seconds to wake up
- Consider upgrading to paid tier for production

---

## Production Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly
- [ ] All environment variables set
- [ ] Firebase authentication working
- [ ] Image upload working
- [ ] AI hair generation working
- [ ] JWT authentication working
- [ ] SSL/HTTPS enabled (automatic on Render)
- [ ] Custom domain configured (optional)

---

## Custom Domain (Optional)

### For Frontend:
1. Go to your Static Site settings
2. Click **"Custom Domain"**
3. Add your domain (e.g., `app.yourdomain.com`)
4. Update DNS records as instructed
5. Update backend `CLIENT_URL` with new domain

### For Backend:
1. Go to your Web Service settings
2. Click **"Custom Domain"**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed
5. Update frontend `VITE_API_URL` with new domain

---

## Maintenance

### Updating Your App

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Render will automatically redeploy (if auto-deploy is enabled)

### Manual Deploy

1. Go to your service on Render
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## Cost Optimization

**Free Tier Limitations:**
- 750 hours/month for web services
- Services spin down after 15 minutes of inactivity
- Limited bandwidth and build minutes

**Upgrade Considerations:**
- Starter ($7/month): Always-on, no cold starts
- Standard ($25/month): Better performance, more resources
- Static sites: Always free (unlimited builds)

---

## Support

If you encounter issues:
1. Check Render documentation: https://render.com/docs
2. Check deployment logs
3. Verify all environment variables
4. Test locally first: `npm run dev`

---

## URLs Reference

After deployment, keep track of your URLs:

```
Backend URL:  https://ai-hair-simulation-backend.onrender.com
Frontend URL: https://ai-hair-simulation-frontend.onrender.com
```

Update these in your environment variables and CORS settings.

---

## Local Development

To test locally before deploying:

```bash
# Install all dependencies
npm run install-all

# Run development servers
npm run dev

# Test production builds
npm run build:client
npm run start:server
```

---

**Deployment Date:** _________
**Backend URL:** _________
**Frontend URL:** _________
**Status:** _________
