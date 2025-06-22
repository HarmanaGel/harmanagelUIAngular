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

# Create package.json for production
RUN echo '{"name": "server", "version": "1.0.0", "dependencies": {"express": "^4.18.2"}}' > package.json

# Install express
RUN npm install

# Create server.js with proper SPA routing
RUN echo 'const express = require("express"); \
const path = require("path"); \
const app = express(); \
const port = process.env.PORT || 3000; \
\
console.log("Starting server..."); \
console.log("Files in directory:", require("fs").readdirSync(".")); \
\
app.use(express.static(__dirname)); \
\
app.get("*", (req, res) => { \
  console.log("Serving:", req.url); \
  res.sendFile(path.join(__dirname, "index.html")); \
}); \
\
app.listen(port, "0.0.0.0", () => { \
  console.log(`Server running on http://0.0.0.0:${port}`); \
});' > server.js

EXPOSE 3000

CMD ["node", "server.js"]