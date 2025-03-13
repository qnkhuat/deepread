#!/usr/bin/env node

const path = require('path');
const { createServer } = require('http');
const { readFileSync, existsSync } = require('fs');
const open = require('open');

// Path to frontend files
const frontendPath = path.join(__dirname, '..', 'frontend');

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
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end(`Server Error: ${err.message}`);
  }
});

// Start server on a random port
server.listen(0, () => {
  const port = server.address().port;
  const url = `http://localhost:${port}`;
  console.log(`DeepRead is running at ${url}`);
  open(url);
}); 
