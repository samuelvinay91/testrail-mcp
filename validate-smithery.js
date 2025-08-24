#!/usr/bin/env node

/**
 * Smithery AI Publishing Validation Script
 * Validates that all required files and configurations are present for successful publishing
 */

import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`)
};

function validateFile(filePath, description, required = true) {
  if (fs.existsSync(filePath)) {
    log.success(`${description}: ${filePath}`);
    return true;
  } else {
    if (required) {
      log.error(`Missing ${description}: ${filePath}`);
    } else {
      log.warn(`Optional file missing: ${filePath}`);
    }
    return !required;
  }
}

function validatePackageJson() {
  log.title('\n📦 Validating package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredFields = ['name', 'version', 'description', 'main', 'scripts', 'dependencies'];
    let valid = true;
    
    requiredFields.forEach(field => {
      if (packageJson[field]) {
        log.success(`package.json has ${field}`);
      } else {
        log.error(`package.json missing ${field}`);
        valid = false;
      }
    });
    
    // Check for essential scripts
    const requiredScripts = ['start', 'build'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log.success(`package.json has script: ${script}`);
      } else {
        log.error(`package.json missing script: ${script}`);
        valid = false;
      }
    });
    
    return valid;
  } catch (error) {
    log.error(`Failed to parse package.json: ${error.message}`);
    return false;
  }
}

function validateDockerfile() {
  log.title('\n🐳 Validating Dockerfile');
  
  try {
    const dockerfileContent = fs.readFileSync('Dockerfile', 'utf8');
    
    const checks = [
      { pattern: /FROM.*node.*AS builder/, desc: 'Multi-stage build with builder stage' },
      { pattern: /FROM.*node.*AS production/, desc: 'Multi-stage build with production stage' },
      { pattern: /npm ci(?!\s+--only=production)/, desc: 'Full dependencies install in builder' },
      { pattern: /npm run build/, desc: 'Build command present' },
      { pattern: /npm ci --only=production/, desc: 'Production dependencies in final stage' },
      { pattern: /COPY --from=builder/, desc: 'Copy from builder stage' },
      { pattern: /USER testrail/, desc: 'Non-root user' },
      { pattern: /HEALTHCHECK/, desc: 'Health check configured' },
      { pattern: /org\.opencontainers\.image/, desc: 'OCI labels present' }
    ];
    
    let valid = true;
    checks.forEach(check => {
      if (check.pattern.test(dockerfileContent)) {
        log.success(check.desc);
      } else {
        log.error(`Missing: ${check.desc}`);
        valid = false;
      }
    });
    
    return valid;
  } catch (error) {
    log.error(`Failed to read Dockerfile: ${error.message}`);
    return false;
  }
}

function validateSmitheryConfig() {
  log.title('\n⚙️ Validating smithery.yaml');
  
  try {
    const smitheryContent = fs.readFileSync('smithery.yaml', 'utf8');
    
    const requiredSections = [
      'runtime',
      'version'
    ];
    
    let valid = true;
    requiredSections.forEach(section => {
      if (smitheryContent.includes(`${section}:`)) {
        log.success(`smithery.yaml has ${section} section`);
      } else {
        log.error(`smithery.yaml missing ${section} section`);
        valid = false;
      }
    });
    
    // Check for TypeScript runtime
    if (smitheryContent.includes('runtime: "typescript"')) {
      log.success('smithery.yaml configured for TypeScript runtime');
    } else {
      log.warn('smithery.yaml not configured for TypeScript runtime');
    }
    
    return valid;
  } catch (error) {
    log.error(`Failed to read smithery.yaml: ${error.message}`);
    return false;
  }
}

function validateBuildOutput() {
  log.title('\n🔨 Validating build output');
  
  const distExists = fs.existsSync('dist');
  const indexExists = fs.existsSync('dist/index.js');
  
  if (distExists && indexExists) {
    log.success('Build output exists (dist/index.js)');
    return true;
  } else {
    log.error('Build output missing. Run "npm run build" first.');
    return false;
  }
}

function main() {
  log.title('🚀 TestRail MCP Server - Smithery AI Publishing Validation');
  log.info('Checking all requirements for successful Smithery AI publishing...\n');
  
  const validations = [
    // Required files
    () => validateFile('package.json', 'Package configuration'),
    () => validateFile('Dockerfile', 'Docker configuration'),
    () => validateFile('smithery.yaml', 'Smithery configuration'),
    () => validateFile('.dockerignore', 'Docker ignore file'),
    () => validateFile('README.md', 'Documentation'),
    () => validateFile('LICENSE', 'License file'),
    
    // Optional but recommended files
    () => validateFile('docs/guides/getting-started.md', 'Getting started guide', false),
    () => validateFile('docs/guides/coding-agents-setup.md', 'Setup guide', false),
    () => validateFile('examples/', 'Examples directory', false),
    
    // Content validations
    validatePackageJson,
    validateDockerfile,
    validateSmitheryConfig,
    validateBuildOutput
  ];
  
  let allValid = true;
  validations.forEach(validation => {
    if (!validation()) {
      allValid = false;
    }
  });
  
  log.title('\n📋 Validation Summary');
  if (allValid) {
    log.success('All validations passed! Ready for Smithery AI publishing.');
    log.info('\nNext steps:');
    console.log('1. Commit and push all changes to your repository');
    console.log('2. Try publishing again on Smithery AI');
    console.log('3. The multi-stage Dockerfile should now build successfully');
  } else {
    log.error('Some validations failed. Please fix the issues above before publishing.');
  }
  
  return allValid ? 0 : 1;
}

process.exit(main());