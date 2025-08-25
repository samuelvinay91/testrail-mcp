# Smithery Deployment Guide

## Overview

TestRail MCP Server is now configured for **TypeScript Runtime deployment** on Smithery AI, following the official documentation. This is the recommended approach for TypeScript-based MCP servers.

## Configuration

### Minimal Configuration ✅

The project uses the minimal configuration approach as recommended by Smithery:

```yaml
# smithery.yaml
runtime: "typescript"

# Optional environment variables
env:
  NODE_ENV: "production"
```

### Package Configuration ✅

```json
{
  "module": "src/smithery.ts",
  "type": "module"
}
```

### Entry Point ✅

- **Entry file**: `src/smithery.ts`
- **Export**: Default `createServer` function
- **Config schema**: Exported `configSchema` for user configuration

## Deployment Process

### 1. Local Testing

```bash
# Test with Smithery CLI development mode
npm run dev:smithery

# Build for production
npm run build:smithery
```

### 2. Validation

```bash
# Validate configuration
npm run validate-smithery
```

### 3. Deploy to Smithery

1. **Push code to GitHub** with all changes
2. **Connect GitHub to Smithery** (or claim server if already listed)
3. **Navigate to Deployments tab** on your server page
4. **Click Deploy** - Smithery will:
   - Clone your repository
   - Parse `smithery.yaml` for TypeScript configuration
   - Install dependencies with `npm ci`
   - Build using the module entry point from `package.json`
   - Package into containerized HTTP service
   - Deploy to hosting infrastructure
   - Make available at `https://server.smithery.ai/your-server/mcp`

## What Happens Under the Hood

Smithery TypeScript runtime automatically:

- ✅ Handles containerization
- ✅ Sets up HTTP transport (Streamable HTTP)
- ✅ Manages scaling and load balancing
- ✅ Provides monitoring and logging
- ✅ Generates user configuration forms from `configSchema`

## Key Benefits

1. **Zero Docker knowledge required**
2. **Automatic HTTP transport setup**
3. **Built-in scaling and monitoring**
4. **User-friendly configuration forms**
5. **Hot reload in development**
6. **Production-ready deployment**

## Files Removed

The following Docker-related files were removed to focus on TypeScript runtime:

- ❌ `Dockerfile`
- ❌ `Dockerfile.dev`
- ❌ `docker-compose.yml`
- ❌ `.dockerignore`

## Troubleshooting

### Common Issues

1. **Module field missing**: Ensure `package.json` has `"module": "src/smithery.ts"`
2. **Dependencies not found**: All dependencies must be in `dependencies` or `devDependencies`
3. **Build fails**: Test locally with `npm run build:smithery`

### Validation

Always run validation before deploying:

```bash
npm run validate-smithery
```

All checks should pass:
- ✅ Package configuration
- ✅ Smithery configuration
- ✅ TypeScript entry point
- ✅ Build output

## Support

- **Documentation**: [Smithery TypeScript Deployment](https://smithery.ai/docs/build/deployments/typescript)
- **Issues**: GitHub Issues
- **Validation**: Run `npm run validate-smithery`