const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL
  let parsedUrl = req.url.split('?')[0];
  if (parsedUrl === '/') {
    parsedUrl = '/index.html';
  }

  // Safe file path resolution
  let filePath = path.join(PUBLIC_DIR, decodeURIComponent(parsedUrl));
  
  // Also check if file exists in www directory
  if (!fs.existsSync(filePath)) {
    const wwwPath = path.join(PUBLIC_DIR, 'www', decodeURIComponent(parsedUrl));
    if (fs.existsSync(wwwPath)) {
      filePath = wwwPath;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexFallback = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(indexFallback)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexFallback).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileName = path.basename(filePath);

    // Service worker needs no-store + Service-Worker-Allowed scope header
    const isServiceWorker = fileName === 'sw.js';
    const isManifest = fileName === 'manifest.json';
    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': (isServiceWorker || isManifest) ? 'no-store' : 'public, max-age=3600',
    };
    if (isServiceWorker) headers['Service-Worker-Allowed'] = '/';

    res.writeHead(200, headers);

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`=======================================================`);
  console.log(`🚀 EdEquality Mobile App Server Running!`);
  console.log(`-------------------------------------------------------`);
  console.log(`📱 Mobile Simulator:     http://localhost:${PORT}/mobile.html`);
  console.log(`💻 Mobile App Direct:    http://localhost:${PORT}`);
  console.log(`📶 Local Network Phone:  http://${localIp}:${PORT}`);
  console.log(`=======================================================`);
});
