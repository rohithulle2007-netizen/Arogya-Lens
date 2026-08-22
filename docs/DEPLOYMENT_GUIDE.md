# Arogya Lens — Production Cloud Deployment & Expo Mobile Build Guide

Comprehensive deployment reference for deploying the FastAPI AI inference backend to the cloud, hosting the web application, and building the native mobile application with Expo.

---

## ☁️ 1. Backend Cloud Deployment Options

### Option A: Render (Recommended — 1-Click Free Tier)
1. Push this repository to your GitHub account.
2. Log in to [Render.com](https://render.com/) and click **New +** $\rightarrow$ **Blueprint**.
3. Connect your repository. Render will automatically detect [`render.yaml`](file:///Users/rohit/Documents/Arogya%20Lens/render.yaml).
4. Click **Apply**.
5. Once deployed, your live API URL will be:
   `https://arogya-lens-backend.onrender.com`
   - Health check: `https://arogya-lens-backend.onrender.com/api/health`
   - Swagger docs: `https://arogya-lens-backend.onrender.com/docs`

---

### Option B: Railway
1. Install Railway CLI: `npm i -g @railway/cli`
2. Log in and initialize:
   ```bash
   railway login
   railway init
   railway up
   ```
3. Railway automatically uses [`Dockerfile`](file:///Users/rohit/Documents/Arogya%20Lens/Dockerfile) and [`railway.json`](file:///Users/rohit/Documents/Arogya%20Lens/railway.json).

---

### Option C: Docker Container (Any VPS / Cloud Server)
```bash
# Build the Docker image
docker build -t arogya-lens:latest .

# Run container with persistent storage
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  --name arogya-lens \
  arogya-lens:latest
```

---

## 🌐 2. Web Frontend Deployment (Vercel / Netlify / GitHub Pages)

### Vercel:
```bash
npm i -g vercel
vercel --prod
```

### GitHub Pages:
The repository includes [`.github/workflows/deploy-frontend.yml`](file:///Users/rohit/Documents/Arogya%20Lens/.github/workflows/deploy-frontend.yml).
Simply push to `main` and enable GitHub Pages under **Repository Settings $\rightarrow$ Pages $\rightarrow$ GitHub Actions**.

---

## 📱 3. Expo Mobile Application Setup & Build

The mobile application is located in the [`mobile/`](file:///Users/rohit/Documents/Arogya%20Lens/mobile) directory.

### Quick Start with Expo Go (Local Development):
```bash
cd mobile

# 1. Install mobile dependencies
npm install

# 2. Start Expo Metro bundler
npm run start
```
- Open **Expo Go** on your physical iPhone or Android device and scan the displayed QR code.
- In the mobile app's **Profile Screen**, set the Server URL to your local WiFi address (e.g. `http://192.168.1.5:8000`) or your deployed cloud backend URL.

### Building Standalone Mobile App (APK / IPA) with EAS Build:
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Log in to Expo account
eas login

# 3. Configure EAS project
eas build:configure

# 4. Build Android APK (Direct installable)
eas build -p android --profile preview

# 5. Build iOS App (TestFlight / AdHoc)
eas build -p ios --profile preview
```
