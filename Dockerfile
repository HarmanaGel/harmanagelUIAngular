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

# Install serve package globally
RUN npm install -g serve

# Copy built application
COPY --from=build /app/dist/amazon-frontend ./

# Expose port
EXPOSE 3000

# Serve with SPA support (-s flag for Single Page Application)
CMD ["serve", "-s", ".", "-l", "3000", "-n"]