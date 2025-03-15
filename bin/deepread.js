#!/usr/bin/env node

const path = require('path');
const {createServer} = require('http');
const {readFileSync, existsSync} = require('fs');
const net = require('net');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments using yargs
const argv = yargs(hideBin(process.argv))
  .option('host', {
    alias: 'h',
    type: 'string',
    description: 'Host to bind the server to',
    default: 'localhost'
  })
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'Port to start looking for an available port',
    default: 8080
  })
  .help()
  .alias('help', '?')
  .version()
  .argv;

const host = argv.host;
const startPort = argv.port;

// Path to frontend files - try multiple locations
let frontendPath;

// Check different possible locations for the frontend files
const possiblePaths = [
  // When running as an npm package
  path.join(__dirname, 'frontend'),
  // When running from the development environment
  path.join(__dirname, '..', 'frontend', 'dist'),
];

// Find the first path that exists and contains an index.html file
for (const p of possiblePaths) {
  if (existsSync(p) && existsSync(path.join(p, 'index.html'))) {
    frontendPath = p;
    break;
  }
}

if (!frontendPath) {
  console.error('Could not find frontend files. Please make sure they are built correctly.');
  process.exit(1);
}

// Simple content type mapping
const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

// Create server
const server = createServer((req, res) => {
  try {
    // Default to index.html for root or non-existent files
    let url = req.url === '/' ? '/index.html' : req.url;
    let filePath = path.join(frontendPath, url);

    // Serve index.html for routes that don't exist (for SPA routing)
    if (!existsSync(filePath)) {
      filePath = path.join(frontendPath, 'index.html');
    }

    // Get content type based on file extension
    const ext = path.extname(filePath);
    const contentType = contentTypes[ext] || 'text/plain';

    // Read and serve the file
    const content = readFileSync(filePath);
    res.writeHead(200, {'Content-Type': contentType});
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end(`Server Error: ${err.message}`);
  }
});

// Start server on the specified port
(async () => {
  try {
    server.listen(startPort, host, () => {
      const url = `http://${host}:${startPort}`;
      console.log(`DeepRead is running at ${url}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
