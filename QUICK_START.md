# Quick Start Guide

## ✅ Setup Complete! Here's What's Ready:

### Local Development Files Created:
- ✅ `server/.env` - Server environment variables
- ✅ `server/serviceAccountKey.json` - Firebase credentials
- ✅ `client/.env` - Client environment variables

### Documentation Created:
- 📖 [DEPLOYMENT.md](DEPLOYMENT.md) - Complete Render deployment guide
- 📖 [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Firebase configuration guide
- 📖 [RENDER_CONFIG.md](RENDER_CONFIG.md) - Quick Render settings reference

---

## 🚀 Run Locally (Right Now!)

### 1. Add Your Replicate API Token

Edit `server/.env` and add your Replicate token:
```env
REPLICATE_API_TOKEN=r8_your-actual-token-here
```

Get your token from: https://replicate.com/account/api-tokens

### 2. Start the Application

```bash
# Option 1: Run both frontend and backend together
npm run dev

# Option 2: Run separately
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### 3. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

---

## 🌐 Deploy to Render.com

### Prerequisites Checklist:
- [ ] Code pushed to GitHub
- [ ] Replicate API token ready
- [ ] Firebase credentials ready (already configured!)

### Deployment Steps:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

2. **Deploy Backend (Web Service):**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - New → Web Service
   - Connect your repository
   - Configure as per [RENDER_CONFIG.md](RENDER_CONFIG.md)
   - Add environment variables from [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
   - Deploy and copy the URL

3. **Deploy Frontend (Static Site):**
   - New → Static Site
   - Connect same repository
   - Configure as per [RENDER_CONFIG.md](RENDER_CONFIG.md)
   - Set `VITE_API_URL` with backend URL
   - Deploy and copy the URL

4. **Update Backend CORS:**
   - Go to backend service → Environment
   - Update `CLIENT_URL` with frontend URL
   - Service auto-redeploys

### Detailed Instructions:
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step guide.

---

## 📋 Environment Variables Summary

### Local Development (.env files already created)
- ✅ Server: Uses `serviceAccountKey.json` file
- ✅ Client: Points to `http://localhost:5000/api`

### Production (Render.com)
Use environment variables from these docs:
- Server: See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Step 2
- Client: `VITE_API_URL=https://your-backend.onrender.com/api`

---

## 🔑 Required API Keys

### 1. Replicate API Token
- **Get it from:** https://replicate.com/account/api-tokens
- **Add to:** `server/.env` (local) or Render environment variables (production)
- **Variable name:** `REPLICATE_API_TOKEN`

### 2. JWT Secret
- **For local:** Already set to `dev-secret-change-in-production`
- **For production:** Generate with:
  ```bash
  openssl rand -base64 32
  ```

### 3. Firebase Credentials
- ✅ Already configured in `server/serviceAccountKey.json`
- For Render, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

---

## 📁 Project Structure

```
ai_hair_simulation/
├── client/                    # React frontend (Vite)
│   ├── src/
│   ├── .env                   # Local API URL
│   └── .env.example          # Template
├── server/                    # Express backend
│   ├── src/
│   ├── .env                   # Local environment variables
│   ├── .env.example          # Template
│   ├── serviceAccountKey.json # Firebase credentials (gitignored)
│   └── serviceAccountKey.json.example # Template
├── DEPLOYMENT.md             # Full deployment guide
├── FIREBASE_SETUP.md         # Firebase configuration
├── RENDER_CONFIG.md          # Quick Render reference
└── package.json              # Root scripts
```

---

## ✅ Pre-Deployment Checklist

- [ ] Dependencies installed (`npm run install-all` already done!)
- [ ] Replicate API token added to `server/.env`
- [ ] Local development working (`npm run dev`)
- [ ] Code committed to Git
- [ ] Code pushed to GitHub
- [ ] Ready to create Render account

---

## 🆘 Need Help?

- **Local development issues:** Check [FIREBASE_SETUP.md](FIREBASE_SETUP.md) troubleshooting section
- **Deployment issues:** See [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting
- **Quick config reference:** [RENDER_CONFIG.md](RENDER_CONFIG.md)

---

## 🎯 Next Actions

### To Test Locally:
1. Add Replicate token to `server/.env`
2. Run `npm run dev`
3. Open http://localhost:5173

### To Deploy:
1. Add Replicate token
2. Test locally first
3. Commit and push to GitHub
4. Follow [DEPLOYMENT.md](DEPLOYMENT.md)

---

**You're all set!** 🎉

Start with local testing, then deploy to Render when ready.
