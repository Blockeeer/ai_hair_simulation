# Firebase Setup Guide

## ✅ Your Firebase is Already Configured!

Your `serviceAccountKey.json` is already in place with these credentials:
- **Project ID:** `ai-hair-simulator`
- **Client Email:** `firebase-adminsdk-fbsvc@ai-hair-simulator.iam.gserviceaccount.com`

---

## File Locations

### Local Development (Current Setup)
```
server/
├── .env                          # Your local environment variables
├── serviceAccountKey.json        # Firebase credentials (DO NOT COMMIT!)
└── serviceAccountKey.json.example # Template for reference
```

**Current `.env` configuration:**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
```

This tells the server to use the JSON file for Firebase authentication.

---

## For Render.com Deployment

When deploying to Render, you **cannot upload the JSON file**. Instead, you need to use **environment variables**.

### Step 1: Extract Values from serviceAccountKey.json

From your existing [server/serviceAccountKey.json](server/serviceAccountKey.json), extract these values:

1. **FIREBASE_PROJECT_ID**
   ```
   ai-hair-simulator
   ```

2. **FIREBASE_PRIVATE_KEY** (the entire private key including newlines)
   ```
   -----BEGIN PRIVATE KEY-----
   MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCF9Phtm47oeDuI
   Pcbmh/BESyrHYcNsCzofFrFHaLf+li4L9cevEBxJ4sSq6xVxm8XfKORXOWEbKZZo
   ...
   (full key here)
   ...
   suBHN8tOCg5YPP7p2vlx6zyq
   -----END PRIVATE KEY-----
   ```

3. **FIREBASE_CLIENT_EMAIL**
   ```
   firebase-adminsdk-fbsvc@ai-hair-simulator.iam.gserviceaccount.com
   ```

### Step 2: Add to Render Environment Variables

When creating your Web Service on Render:

1. Go to **Advanced** → **Environment Variables**
2. Add these three variables:

```env
FIREBASE_PROJECT_ID=ai-hair-simulator

FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCF9Phtm47oeDuI
Pcbmh/BESyrHYcNsCzofFrFHaLf+li4L9cevEBxJ4sSq6xVxm8XfKORXOWEbKZZo
zywwi5w3K+/M+klDoiyesXt+hsKtj1LCf6bGlgOeYuX7b74NKFvGOnQG5Ijobnab
SFjXBQvQH+7lHXutPUWTT6AA4ydNvkT3eI0RhocQqBuOvzSKBZKLjGL9TtqaD6TP
wd2q6s1+7TC0OsqIm8iPGEwYdKWlwoRZrAtz3EF5J22P+czSkRtaLX9Cqjza/TwX
37JZm3twJP5KaozB7mecS0fUG55aa2JVLzdFnCIOnuD/6RLbhSH7eAhMgJ/ruCX1
UGZdsSrVAgMBAAECggEAE3+QLEl48ww9Lhw/4re6w1YQSKv0SWUWSrF/kHNaWiul
/DEEUHkPL7oFrRNBhc3fbsIsVSiRopCFHNsQWuiXY83OE+StMV5eZvhSj3IyIsKP
5fu1XNvidErU9apS3Dtu+wWbHz24p+HG+zH8Acrxkz5yrtWBy7pKxvckxRGgsPIL
0ogWMv4otW3SknQZZtofK4zr7OEQfyyzlcy6kLpDrPcZwcyuhc6DzfxDbgS/C52I
jxyFkZ2BK2bOgNfNRDDXZD2jwDup+fu8kXa/m02RdB9NK5zieugv8OCaxfkWT/X5
Re/UsrUUhBs9Bc2igUV0x+ceAPE+SBI6vKBUrM+xqQKBgQC6dr+QxtCxOB36w0/n
G+HrBispMgUiOXKBbGCwGEKZtXS6FhVENuEnlJVbkI1YayU/5P4loKew8Xpj/SET
hNAQu5Ma5KK1aRkw624HpZxNhLLYykloGEMENtqgJa3zq8Qltd9BVPpVPU525CTK
0TXiFDFxaBf9W+QmIv8dESqilwKBgQC36YL9PzJmPGjsNMINLTVUdnBAD60MjCDC
Naj7Z1bFMElIoc1r6ssG+ouh4AwFWg0G27OWMHEDuQBpR/cZfC2K8HrMDFHcIbY1
3V3wtWWDNrE/oeNT75rRBUexwZxxkH/hL0SnkEu67kShQX+t/mUzRZTByvhkDT9A
RvR8xqgHcwKBgQC48Fh2FsscSqVpdthER6JeQaMDW+o9lK7ecQjA/37nB1N70bVM
EAZnBHbS919JqBOs+Mmdtmc8F3WlwIVS37KiNfjkfopm1ZO3snpSOU76j7f3T0NZ
bF7jyigzGMwcV2vXXzjMiqUzb/fn8cYQJ0qDLjYP3geVMdPqg2F2ifU4hwKBgQCA
1Y4zhg/yWqNNxO+jd2YCky2zUsfxIEDai+iipRO980ODJAXZcZNkgiNK9L63CQxT
H5lAvxKMfw7wsb9CFSF6UVhUlNTLlrokJbznIMvKDYhBgVDUvecAQeild3H2hDlx
MEGx+H10p/Ff3Zhp9OpD7px03ZD/1d/XUV14A1o2TQKBgFQxPSuHVsiYMBHFemcQ
/Ye5XBiBM3CnMI7fe9dGsvbfmyqGSyQJsO3odq9jYTj47/iDlQ4wd2JDRPPsolqe
AP32UKDtwsdUJJASvqdvN3v9PQICMdsktmXB5yu9a7mCfqZjU6xR47Bdo59IfOvr
suBHN8tOCg5YPP7p2vlx6zyq
-----END PRIVATE KEY-----

FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@ai-hair-simulator.iam.gserviceaccount.com
```

**IMPORTANT:**
- Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep all the line breaks (newlines) in the key
- Render will handle the newlines properly

### Step 3: Do NOT Set FIREBASE_SERVICE_ACCOUNT_PATH on Render

On Render, **do not** add the `FIREBASE_SERVICE_ACCOUNT_PATH` variable. The code in [server/src/config/firebase.js](server/src/config/firebase.js) will automatically detect the environment variables and use them instead.

---

## How It Works

The Firebase configuration in [server/src/config/firebase.js](server/src/config/firebase.js:6-40) supports two methods:

### Method 1: Service Account File (Local Development)
```javascript
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  // Uses serviceAccountKey.json file
}
```

### Method 2: Environment Variables (Production/Render)
```javascript
else if (process.env.FIREBASE_PROJECT_ID &&
         process.env.FIREBASE_PRIVATE_KEY &&
         process.env.FIREBASE_CLIENT_EMAIL) {
  // Uses environment variables
}
```

The code automatically chooses the right method based on what's available.

---

## Security Checklist

- ✅ `serviceAccountKey.json` is in `.gitignore`
- ✅ Never commit Firebase credentials to Git
- ✅ Use environment variables on Render
- ✅ Keep your private key secure
- ✅ Don't share credentials publicly

---

## Testing Locally

To test if Firebase is working:

```bash
cd server
npm start
```

You should see:
```
Firebase Admin initialized successfully
Server running in development mode on port http://localhost:5000
```

If you see errors about Firebase, check:
1. `serviceAccountKey.json` exists in `server/` directory
2. `.env` file has `FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json`
3. JSON file is valid (proper formatting)

---

## Troubleshooting

### Error: "Firebase configuration not found"
- Check that `.env` file exists in `server/` directory
- Verify `FIREBASE_SERVICE_ACCOUNT_PATH` is set correctly

### Error: "ENOENT: no such file or directory"
- Make sure `serviceAccountKey.json` is in the `server/` directory (not `server/src/`)

### Error: "Invalid service account"
- Verify the JSON file is properly formatted
- Check that all fields are present in the JSON

### On Render: "Firebase Admin SDK error"
- Verify all three environment variables are set
- Check that private key includes BEGIN/END markers
- Ensure newlines are preserved in the private key

---

## Next Steps

1. ✅ Local setup is complete - `serviceAccountKey.json` is in place
2. ⏳ When deploying to Render, use the environment variables from Step 2 above
3. ⏳ Add your Replicate API token to `.env` for local development

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.
