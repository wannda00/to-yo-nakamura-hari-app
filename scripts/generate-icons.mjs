import sharp from 'sharp'
import { writeFileSync } from 'fs'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="90" fill="url(#g)"/>
  <polyline
    points="80,340 170,200 260,270 350,140 430,210"
    stroke="white" stroke-width="32" fill="none"
    stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="80"  cy="340" r="18" fill="white"/>
  <circle cx="170" cy="200" r="18" fill="white"/>
  <circle cx="260" cy="270" r="18" fill="white"/>
  <circle cx="350" cy="140" r="18" fill="white"/>
  <circle cx="430" cy="210" r="18" fill="white"/>
</svg>`

const buf = Buffer.from(svg)

await sharp(buf).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(buf).resize(512, 512).png().toFile('public/icon-512.png')
await sharp(buf).resize(180, 180).png().toFile('public/apple-touch-icon.png')

console.log('Icons generated.')
