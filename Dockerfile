# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Backend + serve frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server/ ./server/
COPY --from=frontend-builder /app/client/build ./client/build
EXPOSE 5000
CMD ["node", "server/server.js"]
