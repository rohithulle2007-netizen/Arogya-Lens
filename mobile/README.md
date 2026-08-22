# Arogya Lens — Expo React Native Mobile Application

Native cross-platform mobile application for **Arogya Lens** featuring 4-point optical screening (bilateral eye conjunctiva + bilateral thumb nail bed) for non-invasive hemoglobin assessment.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v26+)
- **Expo Go App**: Download on iOS App Store or Android Google Play Store.

### 2. Installation
```bash
cd mobile
npm install
```

### 3. Start Development Server
```bash
npm run start
```
- A QR code will appear in your terminal.
- Open **Expo Go** on your physical device and scan the QR code.

---

## ⚙️ Connecting Mobile App to Backend Server

1. Ensure the FastAPI backend is running:
   ```bash
   python3 run.py --backend-only
   ```
2. Find your computer's local WiFi IP address (e.g. `ifconfig | grep "inet "`).
3. In the mobile app, go to **Profile $\rightarrow$ Backend Server Connection** and update the URL:
   `http://192.168.x.x:8000` (or your deployed cloud backend URL `https://arogya-lens-backend.onrender.com`).

---

## 📦 Standalone App Builds (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli
eas login
eas build:configure

# Android APK
eas build -p android --profile preview

# iOS IPA
eas build -p ios --profile preview
```
