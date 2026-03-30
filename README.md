# WebToAPK

Convert any website to a downloadable Android APK — built with Next.js.

## Stack
- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Framer Motion**
- **React Hot Toast**
- **ngrok** (for QR share)
- **qrcode** (QR generation)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ngrok Setup (optional — for QR share feature)

1. Create a free account at https://ngrok.com
2. Get your authtoken from the dashboard
3. Set it as an env variable:

```bash
NGROK_AUTHTOKEN=your_token_here npm run dev
```

When an APK is ready, clicking **Get QR Code & Share Link** will:
- Start an ngrok tunnel
- Generate a scannable QR code
- Provide a direct download link valid until server restart

## Repomix
```bash
repomix "D:\0 AMAAN MAIN\My NextJS\web-to-apk-maker" -o prompting/web-to-apk-repomix.md --style markdown --ignore "node_modules,.next,dist,build,.git,.turbo,coverage"
```

## Deploy

```bash
npm run build
npm start
```
