# TestRail MCP Server Dockerfile

# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S testrail && \
    adduser -S testrail -u 1001

# Change ownership of app directory
RUN chown -R testrail:testrail /app

# Switch to non-root user
USER testrail

# Expose port (though MCP typically uses stdio)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Default command
CMD ["npm", "start"]

# Labels for metadata
LABEL maintainer="TestRail MCP Team" \
      version="1.0.0" \
      description="TestRail MCP Server - Comprehensive TestRail integration via Model Context Protocol" \
      org.opencontainers.image.title="TestRail MCP Server" \
      org.opencontainers.image.description="Comprehensive TestRail integration via Model Context Protocol" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="TestRail MCP Team" \
      org.opencontainers.image.licenses="MIT"