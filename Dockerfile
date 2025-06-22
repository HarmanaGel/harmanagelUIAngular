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

# Create server.js with echo commands
RUN echo 'const express = require("express");' > server.js && \
    echo 'const path = require("path");' >> server.js && \
    echo 'const fs = require("fs");' >> server.js && \
    echo 'const app = express();' >> server.js && \
    echo 'const port = process.env.PORT || 3000;' >> server.js && \
    echo '' >> server.js && \
    echo 'console.log("Starting Angular server...");' >> server.js && \
    echo 'console.log("Working directory:", __dirname);' >> server.js && \
    echo 'console.log("Files:", fs.readdirSync(".").join(", "));' >> server.js && \
    echo '' >> server.js && \
    echo 'if (!fs.existsSync("./index.html")) {' >> server.js && \
    echo '  console.error("ERROR: index.html not found!");' >> server.js && \
    echo '  process.exit(1);' >> server.js && \
    echo '}' >> server.js && \
    echo '' >> server.js && \
    echo 'app.use(express.static(".", { dotfiles: "deny", index: "index.html" }));' >> server.js && \
    echo '' >> server.js && \
    echo 'app.get("/health", (req, res) => {' >> server.js && \
    echo '  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });' >> server.js && \
    echo '});' >> server.js && \
    echo '' >> server.js && \
    echo 'app.get("*", (req, res) => {' >> server.js && \
    echo '  console.log(`Serving request: ${req.method} ${req.url}`);' >> server.js && \
    echo '  res.sendFile(path.join(__dirname, "index.html"));' >> server.js && \
    echo '});' >> server.js && \
    echo '' >> server.js && \
    echo 'app.listen(port, "0.0.0.0", () => {' >> server.js && \
    echo '  console.log(`✅ Server running on http://0.0.0.0:${port}`);' >> server.js && \
    echo '  console.log(`✅ Health check: http://0.0.0.0:${port}/health`);' >> server.js && \
    echo '});' >> server.js

EXPOSE 3000

CMD ["node", "server.js"]