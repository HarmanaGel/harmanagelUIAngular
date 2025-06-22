# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application for production
RUN npm run build -- --configuration production

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=build /app/dist/amazon-frontend ./

# Install express directly
RUN npm init -y && npm install express

# Create server.js with better error handling
RUN cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Log startup info
console.log('Starting Angular server...');
console.log('Working directory:', __dirname);
console.log('Files:', fs.readdirSync('.').join(', '));

// Check if index.html exists
if (!fs.existsSync('./index.html')) {
  console.error('ERROR: index.html not found!');
  process.exit(1);
}

// Serve static files
app.use(express.static('.', {
  dotfiles: 'deny',
  index: 'index.html'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Angular SPA - all routes serve index.html
app.get('*', (req, res) => {
  console.log(`Serving request: ${req.method} ${req.url}`);
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
  console.log(`✅ Health check: http://0.0.0.0:${port}/health`);
});
EOF

EXPOSE 3000

# Health check for Docker
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "server.js"]