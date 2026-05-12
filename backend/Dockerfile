# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files for dependency caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Run tests
RUN npm test

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy only package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
  npm cache clean --force

# Copy app code from builder
COPY --from=builder /app . 

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000), (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "server.js"]
