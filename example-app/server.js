const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || '1.0.0';
const ENVIRONMENT = process.env.ENVIRONMENT || 'production';
const DEPLOYMENT_SLOT = process.env.DEPLOYMENT_SLOT || 'blue';

// Health check endpoint
const healthStatus = {
  status: 'healthy',
  version: VERSION,
  environment: ENVIRONMENT,
  slot: DEPLOYMENT_SLOT,
  uptime: 0,
  startTime: new Date().toISOString()
};

const server = http.createServer((req, res) => {
  const startTime = Date.now();
  
  // Logging
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  }));
  
  // Routes
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading page');
        return;
      }
      
      // Inject version info
      let html = data.toString();
      html = html.replace('{{VERSION}}', VERSION);
      html = html.replace('{{ENVIRONMENT}}', ENVIRONMENT);
      html = html.replace('{{SLOT}}', DEPLOYMENT_SLOT);
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  }
  else if (req.url === '/health') {
    healthStatus.uptime = Math.floor((Date.now() - new Date(healthStatus.startTime).getTime()) / 1000);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthStatus));
  }
  else if (req.url === '/ready') {
    // Readiness check
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ready: true }));
  }
  else if (req.url === '/metrics') {
    const metrics = {
      requests: global.requestCount || 0,
      errors: global.errorCount || 0,
      avgResponseTime: global.avgResponseTime || 0
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
  
  // Track metrics
  const duration = Date.now() - startTime;
  global.requestCount = (global.requestCount || 0) + 1;
  global.avgResponseTime = ((global.avgResponseTime || 0) + duration) / 2;
});

server.listen(PORT, () => {
  console.log(JSON.stringify({
    message: 'Server started',
    port: PORT,
    version: VERSION,
    environment: ENVIRONMENT,
    slot: DEPLOYMENT_SLOT,
    timestamp: new Date().toISOString()
  }));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  healthStatus.status = 'shutting_down';
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 30000);
});

module.exports = server;
