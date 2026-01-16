# Use Node.js LTS version
FROM node:20-alpine

# Install MongoDB tools for backup
RUN apk add --no-cache mongodb-tools

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create logs and backup directories
RUN mkdir -p logs db-backups

# Set environment to production
ENV NODE_ENV=production

# Run the bot
CMD ["node", "src/index.js"]
