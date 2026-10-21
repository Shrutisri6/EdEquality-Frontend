/**
 * generate-icons.js
 *
 * Generates PNG icons required for PWA from icon.svg.
 * Run once: node scripts/generate-icons.js
 *
 * Requires: npm install -D sharp
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SRC_SVG = path.join(ROOT, 'icon.svg');
const OUT_DIR = path.join(ROOT, 'icons');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  const svgBuffer = fs.readFileSync(SRC_SVG);

  for (const size of SIZES) {
    // Standard icon (no padding)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(OUT_DIR, `icon-${size}.png`));

    console.log(`✔ icon-${size}.png`);
  }

  // Maskable icons: add ~10% safe-zone padding on all sides
  // The icon content occupies the inner 80% (safe area)
  for (const size of [192, 512]) {
    const padding = Math.round(size * 0.1);
    const innerSize = size - padding * 2;

    const iconBuffer = await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 138, g: 78, b: 30, alpha: 1 }, // --accent #8A4E1E
      },
    })
      .composite([{ input: iconBuffer, top: padding, left: padding }])
      .png()
      .toFile(path.join(OUT_DIR, `icon-${size}-maskable.png`));

    console.log(`✔ icon-${size}-maskable.png`);
  }

  console.log('\n✅ All icons generated in /icons/');
}

main().catch((err) => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
