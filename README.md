# WebToAPK

Convert any website to a downloadable Android APK — built with Next.js.

## Stack
- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Framer Motion**
- **React Hot Toast**

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works
1. User pastes a website URL (e.g. `https://devlabs.automatech.live`)
2. Clicks **Convert to APK**
3. The `/api/generate-apk` route builds an APK package wrapping the URL in a WebView
4. The APK is streamed back and auto-downloaded

## Production APK Generation

For real signed APKs with a full React Native / Capacitor build pipeline, set up:
- Java 17+, Android SDK, Gradle
- Update the API route to invoke a real build tool

The current implementation generates a valid APK structure that can be extended with a proper Android build system.

## Deploy
```bash
npm run build
npm start
```
