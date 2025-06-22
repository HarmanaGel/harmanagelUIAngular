# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application for production
RUN npm run build -- --configuration production

# Production stage - Simple Node.js server
FROM node:18-alpine

WORKDIR /app

# Install serve package globally
RUN npm install -g serve

# Copy built application
COPY --from=build /app/dist/amazon-frontend ./

# Expose port 3000
EXPOSE 3000

# Serve the application
CMD ["serve", "-s", ".", "-l", "3000"]