/**
 * Script to generate PWA icons from SVG
 *
 * Requirements:
 * - sharp (npm install --save-dev sharp)
 *
 * OR use online tools:
 * - https://realfavicongenerator.net/
 * - https://maskable.app/editor
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

async function generateIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
  const iconsDir = join(process.cwd(), 'public', 'icons')

  try {
    // Try to use sharp if available
    const sharp = await import('sharp').catch(() => null)

    if (!sharp) {
      console.log('⚠️  Sharp not installed. Install with: npm install --save-dev sharp')
      console.log('📦 Or use online tool: https://realfavicongenerator.net/')
      console.log('')
      console.log('📋 Sizes needed:')
      sizes.forEach(size => {
        console.log(`   - ${size}x${size}`)
      })
      process.exit(1)
    }

    // Create icons directory
    await mkdir(iconsDir, { recursive: true })

    // Read SVG
    const svgPath = join(process.cwd(), 'public', 'icon.svg')
    const svg = await readFile(svgPath)

    console.log('🎨 Generating PWA icons...')

    // Generate each size
    for (const size of sizes) {
      const outputPath = join(iconsDir, `icon-${size}x${size}.png`)

      await sharp.default(svg)
        .resize(size, size)
        .png()
        .toFile(outputPath)

      console.log(`✓ Generated ${size}x${size}`)
    }

    console.log('\n✅ All icons generated successfully!')

  } catch (error) {
    console.error('❌ Error generating icons:', error)
    process.exit(1)
  }
}

generateIcons()
