const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const brotliDecompress = zlib.brotliDecompressSync;

const BIN_DIR = path.join(__dirname, '../node_modules/chrome-aws-lambda/bin');
const FILES = [
  { src: 'chromium.br', dest: 'chromium' },
  { src: 'aws.tar.br', dest: 'aws.tar' },
  { src: 'swiftshader.tar.br', dest: 'swiftshader.tar' }
];

FILES.forEach(file => {
  const srcPath = path.join(BIN_DIR, file.src);
  const destPath = path.join(BIN_DIR, file.dest);
  if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
    const compressed = fs.readFileSync(srcPath);
    const uncompressed = brotliDecompress(compressed);
    fs.writeFileSync(destPath, uncompressed);
    console.log(`[chromium] Extracted: ${file.src} → ${file.dest}`);
  }
});
