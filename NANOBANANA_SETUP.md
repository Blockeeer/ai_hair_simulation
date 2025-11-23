# NanoBanana API Integration Guide

## 📋 System Overview

Your AI Hair Simulation app uses **NanoBanana API** for hair transformation, NOT Replicate.

### How It Works:

1. **User uploads image** → Client (React)
2. **Image converted to base64** → Processed to 512x512px
3. **Sent to backend** → Express server
4. **NanoBanana API called** → Image-to-image transformation
5. **Result returned** → Displayed to user

---

## 🔧 Current Configuration

### Backend Service: [server/src/services/aiService.js](server/src/services/aiService.js)

**Key Components:**
- **API Endpoint:** `https://api.nanobananaapi.ai/api/v1/nanobanana`
- **Method:** Image-to-Image transformation (`IMAGETOIAMGE`)
- **Process:**
  1. Saves uploaded image locally (`temp_uploads/`)
  2. Creates public URL for the image
  3. Sends request to NanoBanana with image URL + prompt
  4. Polls task status every 3 seconds (max 40 attempts = 2 minutes)
  5. Returns generated image URL

### API Flow:

```javascript
// Step 1: Generate task
POST /generate
{
  "prompt": "Transform this person's hairstyle to: [description]",
  "type": "IMAGETOIAMGE",
  "imageUrls": ["http://your-server/uploads/image.jpg"],
  "numImages": 1
}

// Response:
{
  "code": 200,
  "data": {
    "taskId": "abc123..."
  }
}

// Step 2: Poll status
GET /record-info?taskId=abc123...

// Response when complete:
{
  "code": 200,
  "data": {
    "status": 1,  // 0=processing, 1=success, 2/3=failed
    "imageUrls": ["https://generated-image-url.jpg"]
  }
}
```

---

## ⚙️ Environment Variables

### Local Development (.env)

```env
# NanoBanana API Key
NANOBANANA_API_KEY=your_nanobanana_api_key_here

# Optional: Public URL for serving images
PUBLIC_URL=http://localhost:5000
```

**Current Status:**
- ✅ JWT_SECRET configured
- ✅ Firebase configured
- ⏳ NANOBANANA_API_KEY needs your key

### Production (Render.com)

When deploying to Render:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend.onrender.com
NANOBANANA_API_KEY=your_nanobanana_api_key_here
PUBLIC_URL=https://your-backend.onrender.com

# Firebase credentials...
FIREBASE_PROJECT_ID=ai-hair-simulator
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# JWT
JWT_SECRET=...
```

---

## 📝 How to Get NanoBanana API Key

### Option 1: Official NanoBanana API
1. Visit: https://nanobananaapi.ai (or your provider's website)
2. Sign up for an account
3. Navigate to API Keys section
4. Copy your API key
5. Add to `.env` file

### Option 2: Third-Party Provider
If you're using a reseller or third-party provider:
1. Contact your provider for API credentials
2. They should provide:
   - API Key
   - API Endpoint (already set: `https://api.nanobananaapi.ai/api/v1/nanobanana`)
3. Add the key to your `.env` file

---

## 🚀 Testing Your Setup

### Step 1: Add API Key

Edit [server/.env](server/.env):
```env
NANOBANANA_API_KEY=nb_your_actual_key_here
```

### Step 2: Start the Server

```bash
cd server
npm start
```

Look for this in the console:
```
AI Service initialized
NanoBanana API: Configured ✓
Firebase initialized successfully
Server running in development mode on port http://localhost:5000
```

### Step 3: Test the API

You can test with this curl command:

```bash
curl -X POST http://localhost:5000/api/simulation/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
    "haircutDescription": "short blonde pixie cut"
  }'
```

---

## 🔍 Code Locations

### Backend Files:

1. **[server/src/services/aiService.js](server/src/services/aiService.js)**
   - Main NanoBanana integration
   - Lines 3-8: Configuration
   - Lines 36-86: NanoBanana API call
   - Lines 91-135: Task polling
   - Lines 183-221: Local image storage

2. **[server/src/controllers/simulationController.js](server/src/controllers/simulationController.js)**
   - API endpoint handler
   - Receives image + description from client
   - Calls aiService.changeHaircut()

3. **[server/src/app.js](server/src/app.js)**
   - Line 18: Serves static files from `temp_uploads/`
   - Needed for NanoBanana to access uploaded images

### Frontend Files:

1. **[client/src/pages/simulation.jsx](client/src/pages/simulation.jsx)**
   - Image upload (drag & drop or file select)
   - Resizes to 512x512px (lines 62-83)
   - Sends to backend API

---

## 🔄 Image Processing Flow

### Client Side (simulation.jsx):
```javascript
1. User uploads image
2. Resize to 512x512 (square, 1:1 aspect ratio)
3. Convert to base64 (JPEG, 100% quality)
4. Send to API: POST /api/simulation/generate
```

### Server Side (aiService.js):
```javascript
1. Receive base64 image
2. Save to temp_uploads/ directory
3. Generate public URL: http://localhost:5000/uploads/[filename]
4. Call NanoBanana API with:
   - Image URL
   - Prompt: "Transform this person's hairstyle to: [description]"
5. Poll every 3 seconds for result (max 2 minutes)
6. Return generated image URL to client
```

---

## ⚠️ Important Notes

### Image Storage:
- Images are saved in `server/temp_uploads/`
- This directory is in `.gitignore`
- On Render, this is temporary (ephemeral storage)
- Consider adding cleanup for old files

### API Limits:
- Check with your NanoBanana provider for:
  - Rate limits
  - Usage quotas
  - Pricing
  - Generation time limits

### Error Handling:
The system handles:
- ✅ Missing API key
- ✅ Task timeout (2 minutes)
- ✅ Generation failures
- ✅ Image upload errors
- ✅ Invalid responses

---

## 🐛 Troubleshooting

### Error: "NanoBanana API key not configured"

**Solution:**
1. Check [server/.env](server/.env) has `NANOBANANA_API_KEY=...`
2. Restart the server
3. Verify key is not empty or placeholder value

### Error: "Failed to create generation task"

**Possible causes:**
- Invalid API key
- API endpoint changed
- Network issues
- API service down

**Debug:**
- Check server console for full error message
- Verify API key is correct
- Test API key with provider's documentation

### Error: "Task timeout - generation took too long"

**Possible causes:**
- Server is busy
- Complex image processing
- Network latency

**Solutions:**
- Increase timeout in [aiService.js:91](server/src/services/aiService.js#L91) (`maxAttempts`)
- Retry the generation
- Contact API provider

### Images not accessible by NanoBanana

**Issue:** NanoBanana can't access `localhost:5000/uploads/...`

**Solutions:**
- For local testing: Use `uploadToPublicHost()` method (Telegraph)
- For production: Set `PUBLIC_URL` to your Render backend URL
- Or use external image hosting (already implemented as alternatives)

---

## 📊 Monitoring

### Check if NanoBanana is configured:

Server logs will show:
```
AI Service initialized
NanoBanana API: Configured ✓
```

or

```
AI Service initialized
NanoBanana API: Not configured
```

### During generation:

Watch for these logs:
```
Starting haircut generation with description: [description]
Using NanoBanana API...
Saving image for public access...
Image URL: http://localhost:5000/uploads/haircut_[id].jpg
NanoBanana task created: [taskId]
Task [taskId] status: 0 (attempt 1/40)  // Processing
Task [taskId] status: 1 (attempt 5/40)  // Success!
NanoBanana generation completed successfully
```

---

## 🎯 Next Steps

1. **Get your NanoBanana API key**
2. **Add it to** [server/.env](server/.env)
3. **Run the app:** `npm run dev`
4. **Test hair generation:**
   - Upload a portrait photo
   - Enter hair description (e.g., "long wavy blonde hair")
   - Click generate
   - Wait 10-30 seconds for result

---

## 📚 Additional Resources

- **API Documentation:** Check with your NanoBanana provider
- **Image Requirements:** 512x512px JPEG (handled automatically)
- **Prompt Tips:** Be specific about color, length, style
- **Example Prompts:**
  - "short blonde pixie cut"
  - "long curly black hair"
  - "medium length brown bob with bangs"
  - "mohawk with purple highlights"

---

**Status:** ✅ Everything configured except NANOBANANA_API_KEY
**Action Required:** Add your NanoBanana API key to start using the system!
