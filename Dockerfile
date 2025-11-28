FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files for root and web
COPY package*.json ./
COPY web/package*.json ./web/

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy web source files
COPY web/ ./web/

# Build the frontend
WORKDIR /app/web
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Copy built frontend from builder stage
COPY --from=builder /app/web/dist ./web/dist

# Create necessary directories
RUN mkdir -p server/logs server/uploads

# Expose port
EXPOSE 3000

# Start the application (from root, pointing to server/index.js)
CMD ["node", "server/index.js"]

