# Replicate API Setup Guide

This guide will help you set up the Replicate API for the AI Hair Simulation application.

## What is Replicate?

Replicate is a platform that lets you run machine learning models in the cloud. We're using their **flux-kontext-apps/change-haircut** model to transform hairstyles in images.

## Why Replicate Instead of NanoBanana?

- ✅ **No image hosting required** - Accepts base64 images directly
- ✅ **More reliable** - Enterprise-grade infrastructure
- ✅ **Better error handling** - Clear error messages
- ✅ **Simpler implementation** - Less code, fewer dependencies
- ✅ **Well-documented API** - Extensive documentation and examples

## Step 1: Create a Replicate Account

1. Go to [https://replicate.com](https://replicate.com)
2. Click **Sign Up** in the top right
3. Sign up with GitHub, Google, or email
4. Verify your email address

## Step 2: Get Your API Token

1. Once logged in, go to [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Click **Create token** or copy your existing token
3. Give it a name like "AI Hair Simulation" (optional)
4. Copy the token (it looks like: `r8_...`)
5. **Important:** Keep this token secret! Don't share it or commit it to GitHub

## Step 3: Add Token to Your Environment

### For Local Development:

1. Open `server/.env` file
2. Find the line: `REPLICATE_API_TOKEN=your_replicate_api_token_here`
3. Replace `your_replicate_api_token_here` with your actual token:
   ```env
   REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Save the file

### For Render Deployment:

1. Go to your backend service on Render: https://dashboard.render.com
2. Click on your **ai-hair-simulation-backend** service
3. Go to the **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   - **Key:** `REPLICATE_API_TOKEN`
   - **Value:** Your Replicate API token (starts with `r8_`)
6. Click **Save Changes**
7. Render will automatically redeploy your service

## Step 4: Test the Integration

### Local Testing:

1. Make sure your token is in `server/.env`
2. Restart your server:
   ```bash
   # If running with npm run dev
   # Stop the server (Ctrl+C) and restart

   # Or if running server separately
   cd server
   npm start
   ```
3. Go to http://localhost:5173/simulation
4. Upload an image and try a haircut description like:
   - "Wolf cut"
   - "Bob haircut"
   - "Long curly hair"
   - "Short pixie cut"
   - "Random" (for random style)

### Check Server Logs:

You should see output like:
```
✓ Replicate AI Service initialized successfully
Starting haircut generation with Replicate...
Haircut description: Wolf cut
Preparing Replicate input...
Running Replicate model: flux-kontext-apps/change-haircut
✓ Haircut simulation completed successfully
Result URL: https://replicate.delivery/.../output.png
```

## Supported Haircut Types

The Replicate change-haircut model works best with these types:

- **Specific styles:** "Bob cut", "Pixie cut", "Wolf cut", "Shag", "Layers"
- **Lengths:** "Short hair", "Medium length hair", "Long hair"
- **Textures:** "Curly hair", "Straight hair", "Wavy hair"
- **Random:** Just say "Random" for a random style

## Pricing

Replicate charges per prediction (API call):

- **Free tier:** $5 credit when you sign up
- **After free tier:** Pay-as-you-go pricing (typically $0.01-0.05 per generation)
- Check current pricing: https://replicate.com/flux-kontext-apps/change-haircut

## Troubleshooting

### Error: "Replicate API token not configured"

**Solution:**
1. Check that `REPLICATE_API_TOKEN` is set in your `.env` file
2. Make sure there are no spaces or quotes around the token
3. Restart your server after adding the token

### Error: "Invalid Replicate API token"

**Solution:**
1. Go to https://replicate.com/account/api-tokens
2. Generate a new token
3. Update your `.env` file with the new token
4. Make sure the token starts with `r8_`

### Error: "Replicate API rate limit reached"

**Solution:**
1. Wait a few minutes before trying again
2. Consider upgrading your Replicate plan if you're making many requests
3. Check your usage at https://replicate.com/account/billing

### The haircut doesn't look right

**Tips:**
1. Use clear, well-lit photos with visible faces
2. Try different haircut descriptions
3. Use "Random" for surprising results
4. The model works best with front-facing portraits

## API Documentation

For more details about the model and its parameters:
- Model page: https://replicate.com/flux-kontext-apps/change-haircut
- Replicate API docs: https://replicate.com/docs

## Next Steps

Once you have your token configured:

1. ✅ Test locally at http://localhost:5173/simulation
2. ✅ Add token to Render environment variables
3. ✅ Deploy and test on production: https://ai-hair-simulation-frontend.onrender.com/simulation

---

**Need help?** Open an issue on GitHub or check the Replicate documentation.
