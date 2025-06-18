# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - Sadece dosyalar
FROM scratch

# Copy built application
COPY --from=build /app/dist/amazon-frontend /app/

# Bu container'da web server yok, sadece dosyalar var
# Kubernetes'te kendi web server'ınızla mount edebilirsiniz