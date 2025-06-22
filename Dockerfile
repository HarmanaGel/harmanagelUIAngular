# 1. Build aşaması
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

FROM node:18-alpine

WORKDIR /app

# Küçük, basit bir static server kur
RUN npm install -g http-server

# Angular build çıktısını kopyala
COPY --from=build /app/dist/amazon-frontend ./

# Container başlarken Angular'ı 80. portta sun
EXPOSE 3000
CMD ["http-server", ".", "-p", "3000"]
