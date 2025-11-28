FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p server/logs server/uploads

# Expose port
EXPOSE 3000

# Start the application (from root, pointing to server/index.js)
CMD ["node", "server/index.js"]

