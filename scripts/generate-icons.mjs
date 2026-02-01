import sharp from 'sharp'
import fs from 'fs'

fs.mkdirSync('public', { recursive: true })

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5EEAD4"/>
      <stop offset="1" stop-color="#60A5FA"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#0B1220"/>
  <circle cx="256" cy="256" r="164" fill="url(#g)" opacity="0.18"/>
  <path d="M190 176h132c26 0 46 20 46 46v68c0 26-20 46-46 46H190c-26 0-46-20-46-46v-68c0-26 20-46 46-46Z" fill="url(#g)"/>
  <path d="M206 232h100" stroke="#0B1220" stroke-width="22" stroke-linecap="round" opacity="0.9"/>
  <path d="M206 280h70" stroke="#0B1220" stroke-width="22" stroke-linecap="round" opacity="0.9"/>
  <text x="256" y="365" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="64" fill="#E5E7EB" opacity="0.9">B</text>
</svg>`

const svgBuf = Buffer.from(svg)

await sharp(svgBuf).png().resize(192, 192).toFile('public/pwa-192.png')
await sharp(svgBuf).png().resize(512, 512).toFile('public/pwa-512.png')

// maskable: add padding so it survives masks
await sharp(svgBuf)
  .png()
  .resize(192, 192, { fit: 'contain', background: { r: 11, g: 18, b: 32, alpha: 1 } })
  .toFile('public/pwa-maskable-192.png')
await sharp(svgBuf)
  .png()
  .resize(512, 512, { fit: 'contain', background: { r: 11, g: 18, b: 32, alpha: 1 } })
  .toFile('public/pwa-maskable-512.png')

fs.writeFileSync('public/favicon.svg', svg)

console.log('Generated PWA icons in public/')
