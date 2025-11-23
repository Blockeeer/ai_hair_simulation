# AI Hair Simulation App 💇‍♀️

AI-powered hair simulation application using NanoBanana API for realistic hair transformations.

## 🌟 Features

- 🔐 User authentication (Firebase)
- 📸 Image upload (drag & drop or file select)
- 🤖 AI-powered hair transformation (NanoBanana API)
- 🎨 Custom hair descriptions
- 📱 Responsive design (React + Tailwind CSS)
- ☁️ Cloud deployment ready (Render.com)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- NanoBanana API key
- Firebase project (already set up!)

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Configure Environment Variables

Edit `server/.env` and add your NanoBanana API key:

```env
NANOBANANA_API_KEY=your_nanobanana_api_key_here
```

**Note:** JWT and Firebase are already configured! ✅

### 3. Run the Application

```bash
npm run dev
```

Visit: **http://localhost:5173**

---

## 📁 Project Structure

```
ai_hair_simulation/
├── client/              # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── pages/      # Simulation, Dashboard, Auth pages
│   │   ├── components/ # Reusable UI components
│   │   └── utils/      # API client
│   └── .env
├── server/              # Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # NanoBanana AI integration
│   │   ├── config/         # Firebase setup
│   │   └── routes/         # API routes
│   ├── .env
│   └── serviceAccountKey.json
└── docs/                # Documentation
```

---

## 🔑 Required Configuration

### ✅ Already Configured:
- JWT Secret
- Firebase credentials
- All dependencies installed

### ⏳ You Need to Add:
- **NanoBanana API Key** in `server/.env`

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[NANOBANANA_SETUP.md](NANOBANANA_SETUP.md)** | NanoBanana API integration guide |
| [QUICK_START.md](QUICK_START.md) | Quick reference for running locally |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deploy to Render.com |
| [FIREBASE_SETUP.md](FIREBASE_SETUP.md) | Firebase configuration |

---

## 🔧 Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js + Express
- Firebase Admin
- NanoBanana API

---

## 🎨 How It Works

1. User uploads image → Resized to 512x512px
2. Enters hair description → "long curly black hair"
3. Image sent to backend → Saved locally
4. NanoBanana API called → Image transformation
5. Result returned → Displayed to user

**See:** [NANOBANANA_SETUP.md](NANOBANANA_SETUP.md) for detailed flow

---

## 🐛 Troubleshooting

### "NanoBanana API key not configured"
Add your API key to `server/.env` and restart

### "Cannot connect to backend"
Ensure backend is running on port 5000

**More help:** [NANOBANANA_SETUP.md](NANOBANANA_SETUP.md#-troubleshooting)

---

## 🎉 Get Started Now!

1. Add **NanoBanana API key** to `server/.env`
2. Run `npm run dev`
3. Visit http://localhost:5173
4. Upload image and generate!

---

**Built with ❤️ using React, Express, and NanoBanana AI**
