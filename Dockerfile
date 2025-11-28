FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/ 2>/dev/null || true

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p server/logs server/uploads

# Expose port
EXPOSE 3000

# Set working directory to server
WORKDIR /app/server

# Start the application
CMD ["node", "index.js"]

