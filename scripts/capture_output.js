const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 3045;
const PUBLIC_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\SATHISH\\.gemini\\antigravity\\brain\\eb98f9ae-1aad-4302-8667-82512fac858f';
const SCREENSHOTS_DIR = path.join(PUBLIC_DIR, 'screenshots');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let parsedUrl = req.url.split('?')[0];
      if (parsedUrl === '/') parsedUrl = '/index.html';
      let filePath = path.join(PUBLIC_DIR, decodeURIComponent(parsedUrl));
      if (!fs.existsSync(filePath)) {
        const wwwPath = path.join(PUBLIC_DIR, 'www', decodeURIComponent(parsedUrl));
        if (fs.existsSync(wwwPath)) filePath = wwwPath;
      }
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      });
    });
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Internal test server running on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

function saveFileToOutputs(filename, buffer) {
  // 1. Local project screenshots
  const localPath = path.join(SCREENSHOTS_DIR, filename);
  fs.writeFileSync(localPath, buffer);

  // 2. Artifact directory for inline display
  if (fs.existsSync(ARTIFACT_DIR)) {
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artifactPath, buffer);
  }
  console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
}

async function run() {
  const server = await startServer();

  console.log('Launching headless Microsoft Edge browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. iPhone 15 Pro mobile viewport
  await page.setViewport({
    width: 393,
    height: 852,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  console.log('Capturing Mobile Dashboard...');
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  let buf = await page.screenshot({ type: 'png', fullPage: false });
  saveFileToOutputs('mobile_dashboard.png', buf);

  console.log('Capturing Mobile Textbook Upload & Ingestion view...');
  await page.evaluate(() => {
    if (typeof switchView === 'function') switchView('upload');
  });
  await new Promise(r => setTimeout(r, 800));
  buf = await page.screenshot({ type: 'png', fullPage: false });
  saveFileToOutputs('mobile_upload.png', buf);

  console.log('Capturing Mobile Cultural Translation Studio...');
  await page.evaluate(() => {
    if (typeof switchView === 'function') switchView('cultural_translation');
  });
  await new Promise(r => setTimeout(r, 800));
  buf = await page.screenshot({ type: 'png', fullPage: false });
  saveFileToOutputs('mobile_translation.png', buf);

  console.log('Capturing Mobile Curriculum Alignment...');
  await page.evaluate(() => {
    if (typeof switchView === 'function') switchView('curriculum');
  });
  await new Promise(r => setTimeout(r, 800));
  buf = await page.screenshot({ type: 'png', fullPage: false });
  saveFileToOutputs('mobile_curriculum.png', buf);

  console.log('Capturing Mobile Review Center...');
  await page.evaluate(() => {
    if (typeof switchView === 'function') switchView('review');
  });
  await new Promise(r => setTimeout(r, 800));
  buf = await page.screenshot({ type: 'png', fullPage: false });
  saveFileToOutputs('mobile_review.png', buf);

  console.log('Capturing Mobile Analytics...');
  await page.evaluate(() => {
    if (typeof switchView === 'function') switchView('analytics');
  });
  await new Promise(r => setTimeout(r, 800));
  buf = await page.screenshot({ type: 'png', fullPage: false });
  saveFileToOutputs('mobile_analytics.png', buf);

  // 7. Full Device Mockup View (iPhone 15 Pro Simulator Frame)
  console.log('Capturing Mobile Device Simulator Frame (iPhone 15 Pro chassis)...');
  await page.setViewport({
    width: 1050,
    height: 980,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false
  });
  await page.goto(`http://127.0.0.1:${PORT}/mobile.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1800));
  buf = await page.screenshot({ type: 'png', fullPage: false });
  saveFileToOutputs('mobile_device_frame.png', buf);

  await browser.close();
  server.close();
  console.log('All screenshots captured successfully!');
}

run().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
