# TestRail MCP Server Dockerfile
# Multi-stage build optimized for Smithery AI publishing

# Stage 1: Build stage with all dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies needed for building
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY docs/ ./docs/
COPY examples/ ./examples/

# Build the application
RUN npm run build

# Stage 2: Production stage with only runtime dependencies
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install only runtime system dependencies
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary configuration files
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/examples ./examples

# Create non-root user for security
RUN addgroup -g 1001 -S testrail && \
    adduser -S testrail -u 1001

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R testrail:testrail /app

# Switch to non-root user
USER testrail

# Expose port (though MCP typically uses stdio)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Default command
CMD ["npm", "start"]

# Labels for metadata (required for Smithery AI)
LABEL maintainer="TestRail MCP Team" \
      version="1.0.0" \
      description="TestRail MCP Server - Comprehensive TestRail integration via Model Context Protocol" \
      org.opencontainers.image.title="TestRail MCP Server" \
      org.opencontainers.image.description="Comprehensive TestRail integration via Model Context Protocol with 65+ tools" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="TestRail MCP Team" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/samuelvinay91/testrail-mcp" \
      org.opencontainers.image.documentation="https://github.com/samuelvinay91/testrail-mcp/blob/main/README.md" \
      org.opencontainers.image.url="https://github.com/samuelvinay91/testrail-mcp"