// Simple script to create basic PWA icons
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon content
const generateSVGIcon = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold">K</text>
</svg>`;

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Generating PWA icons...');

iconSizes.forEach(size => {
  const svgContent = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, svgContent.trim());
  console.log(`Generated ${filename}`);
});

// Also create PNG versions using simple SVG fallback
iconSizes.forEach(size => {
  const svgContent = generateSVGIcon(size);
  // For now, just copy SVG content to PNG files as placeholders
  // In a real app, you'd convert SVG to PNG using a library like sharp
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);

  // Create a basic placeholder file
  fs.writeFileSync(filepath, 'PNG placeholder - replace with actual PNG files');
  console.log(`Generated placeholder ${filename}`);
});

console.log('Icon generation complete!');
console.log('\nNote: The PNG files are placeholders. For production, convert the SVG files to PNG format.');
console.log('You can use online tools like https://convertio.co/svg-png/ or libraries like sharp in Node.js');