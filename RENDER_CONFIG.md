# Quick Render Configuration Reference

## Backend Web Service

```yaml
Name: ai-hair-simulation-backend
Type: Web Service
Runtime: Node
Root Directory: server
Build Command: npm install
Start Command: npm start
Branch: main
```

**Environment Variables:**
```
NODE_ENV=production
PORT=5000
CLIENT_URL=https://[your-frontend].onrender.com
FIREBASE_PROJECT_ID=[from-firebase]
FIREBASE_PRIVATE_KEY=[from-firebase]
FIREBASE_CLIENT_EMAIL=[from-firebase]
JWT_SECRET=[generate-random-string]
REPLICATE_API_TOKEN=[from-replicate.com]
```

---

## Frontend Static Site

```yaml
Name: ai-hair-simulation-frontend
Type: Static Site
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: dist
Branch: main
```

**Environment Variables:**
```
VITE_API_URL=https://[your-backend].onrender.com/api
```

---

## Deployment Order

1. ✅ Deploy Backend first → Get URL
2. ✅ Deploy Frontend with backend URL → Get URL
3. ✅ Update Backend CLIENT_URL with frontend URL
4. ✅ Test the application

---

## Generate JWT Secret

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Or use online generator
https://randomkeygen.com/
```
