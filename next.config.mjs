/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok-free.app', '*.ngrok.io'],
  async headers() {
    return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Content-Type', value: 'application/javascript' }] }, { source: '/manifest.json', headers: [{ key: 'Content-Type', value: 'application/manifest+json' }] }]
  }
}
export default nextConfig