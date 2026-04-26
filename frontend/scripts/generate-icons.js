#!/usr/bin/env node
/*
  Generate PWA icons from a source logo (PNG or SVG).
  Usage: node scripts/generate-icons.js [sourcePath]
  Default source: public/vite.svg
*/
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async () => {
  try {
    const root = path.resolve(__dirname, '..');
    const srcArg = process.argv[2];
    const defaultSrc = path.join(root, 'public', 'vite.svg');
    const src = srcArg ? path.resolve(process.cwd(), srcArg) : defaultSrc;
    const outDir = path.join(root, 'public', 'icons');

    if (!fs.existsSync(src)) {
      console.error('Source image not found:', src);
      process.exit(1);
    }

    fs.mkdirSync(outDir, { recursive: true });

    const sizes = [
      { name: 'icon-192.png', size: 192 },
      { name: 'icon-512.png', size: 512 },
      { name: 'apple-touch-icon.png', size: 180 }
    ];

    const input = fs.readFileSync(src);
    for (const { name, size } of sizes) {
      const outPath = path.join(outDir, name);
      await sharp(input)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(outPath);
      console.log('Generated', outPath);
    }

    console.log('All icons generated.');
  } catch (e) {
    console.error('Icon generation failed:', e.message);
    process.exit(1);
  }
})();
