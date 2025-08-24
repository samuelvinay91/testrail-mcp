#!/usr/bin/env node

/**
 * TestRail MCP Server - Coding Agents Setup Script
 * Interactive setup for various AI coding tools and agents
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  subtitle: (msg) => console.log(`${colors.dim}${msg}${colors.reset}`)
};

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function getDefaultConfigPath(agent) {
  const home = os.homedir();
  const platform = os.platform();
  
  const paths = {
    claude: {
      darwin: path.join(home, '.claude-desktop', 'config.json'),
      linux: path.join(home, '.claude-desktop', 'config.json'),
      win32: path.join(home, 'AppData', 'Roaming', 'Claude', 'config.json')
    },
    cursor: {
      darwin: path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'settings.json'),
      linux: path.join(home, '.config', 'Cursor', 'User', 'settings.json'),
      win32: path.join(home, 'AppData', 'Roaming', 'Cursor', 'User', 'settings.json')
    },
    windsurf: {
      darwin: path.join(process.cwd(), '.windsurf', 'mcp-config.json'),
      linux: path.join(process.cwd(), '.windsurf', 'mcp-config.json'),
      win32: path.join(process.cwd(), '.windsurf', 'mcp-config.json')
    },
    continue: {
      darwin: path.join(home, '.continue', 'config.json'),
      linux: path.join(home, '.continue', 'config.json'),
      win32: path.join(home, '.continue', 'config.json')
    }
  };
  
  return paths[agent] ? paths[agent][platform] : null;
}

function generateConfig(agent, config) {
  const serverPath = path.resolve(process.cwd(), 'dist', 'index.js');
  
  const configs = {
    claude: {
      mcpServers: {
        testrail: {
          command: 'node',
          args: [serverPath],
          env: {
            TESTRAIL_BASE_URL: config.baseUrl,
            TESTRAIL_USERNAME: config.username,
            TESTRAIL_API_KEY: config.apiKey
          }
        }
      }
    },
    
    cursor: {
      mcp: {
        servers: [{
          name: 'testrail',
          command: 'node',
          args: [serverPath],
          cwd: process.cwd(),
          env: {
            TESTRAIL_BASE_URL: config.baseUrl,
            TESTRAIL_USERNAME: config.username,
            TESTRAIL_API_KEY: config.apiKey
          }
        }]
      }
    },
    
    windsurf: {
      servers: {
        testrail: {
          command: 'node',
          args: [serverPath],
          env: {
            TESTRAIL_BASE_URL: config.baseUrl,
            TESTRAIL_USERNAME: config.username,
            TESTRAIL_API_KEY: config.apiKey
          },
          transport: 'stdio'
        }
      }
    },
    
    continue: {
      models: [{
        title: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: config.anthropicKey || 'your-anthropic-api-key'
      }],
      mcpServers: [{
        name: 'testrail',
        command: 'node',
        args: [serverPath],
        env: {
          TESTRAIL_BASE_URL: config.baseUrl,
          TESTRAIL_USERNAME: config.username,
          TESTRAIL_API_KEY: config.apiKey
        }
      }]
    }
  };
  
  return configs[agent];
}

async function setupAgent(agent, agentName) {
  log.title(`\n🔧 Setting up ${agentName}`);
  
  const configPath = getDefaultConfigPath(agent);
  if (!configPath) {
    log.error(`Platform not supported for ${agentName}`);
    return false;
  }
  
  log.info(`Config will be saved to: ${configPath}`);
  
  // Get TestRail credentials
  const baseUrl = await question('TestRail Base URL (e.g., https://yourcompany.testrail.io): ');
  const username = await question('TestRail Username/Email: ');
  const apiKey = await question('TestRail API Key: ');
  
  let anthropicKey = '';
  if (agent === 'continue') {
    anthropicKey = await question('Anthropic API Key (optional, for Continue): ') || 'your-anthropic-api-key';
  }
  
  const config = generateConfig(agent, { baseUrl, username, apiKey, anthropicKey });
  
  try {
    // Create directory if it doesn't exist
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Handle existing config
    let finalConfig = config;
    if (fs.existsSync(configPath)) {
      const existingContent = fs.readFileSync(configPath, 'utf8');
      try {
        const existingConfig = JSON.parse(existingContent);
        
        if (agent === 'claude') {
          existingConfig.mcpServers = { ...existingConfig.mcpServers, ...config.mcpServers };
          finalConfig = existingConfig;
        } else if (agent === 'cursor') {
          existingConfig.mcp = config.mcp;
          finalConfig = existingConfig;
        } else {
          // For other agents, merge at top level
          finalConfig = { ...existingConfig, ...config };
        }
      } catch (e) {
        log.warn('Existing config file is not valid JSON, will be replaced');
      }
    }
    
    fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
    log.success(`${agentName} configuration saved successfully!`);
    
    // Provide usage instructions
    log.subtitle(`\nUsage instructions for ${agentName}:`);
    
    switch (agent) {
      case 'claude':
        console.log('1. Restart Claude Desktop');
        console.log('2. TestRail tools will be available in conversations');
        console.log('3. Try: "Connect to TestRail and show me all projects"');
        break;
      case 'cursor':
        console.log('1. Restart Cursor IDE');
        console.log('2. Open Cursor Chat (Cmd/Ctrl + L)');
        console.log('3. Try: "@testrail get all projects"');
        break;
      case 'windsurf':
        console.log('1. Open Windsurf Chat panel');
        console.log('2. Try: "/mcp testrail get_projects"');
        break;
      case 'continue':
        console.log('1. Restart VS Code');
        console.log('2. Use Continue extension');
        console.log('3. Try: "Use TestRail to create test cases for this code"');
        break;
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to save configuration: ${error.message}`);
    return false;
  }
}

async function main() {
  log.title('🚀 TestRail MCP Server - Coding Agents Setup');
  log.subtitle('This script will help you configure TestRail MCP integration with your preferred AI coding tool.\n');
  
  // Check if the server is built
  const distPath = path.join(process.cwd(), 'dist', 'index.js');
  if (!fs.existsSync(distPath)) {
    log.error('TestRail MCP Server not built. Please run "npm run build" first.');
    process.exit(1);
  }
  
  log.success('TestRail MCP Server found and ready for configuration.\n');
  
  const agents = [
    { key: '1', name: 'claude', displayName: 'Claude Desktop' },
    { key: '2', name: 'cursor', displayName: 'Cursor IDE' },
    { key: '3', name: 'windsurf', displayName: 'Windsurf IDE' },
    { key: '4', name: 'continue', displayName: 'Continue (VS Code)' },
    { key: '5', name: 'manual', displayName: 'Show manual configuration' },
    { key: '0', name: 'exit', displayName: 'Exit' }
  ];
  
  while (true) {
    console.log('\nSelect your AI coding tool:');
    agents.forEach(agent => {
      console.log(`${agent.key}. ${agent.displayName}`);
    });
    
    const choice = await question('\nEnter your choice (1-5, 0 to exit): ');
    
    const selectedAgent = agents.find(a => a.key === choice);
    if (!selectedAgent) {
      log.warn('Invalid choice. Please try again.');
      continue;
    }
    
    if (selectedAgent.name === 'exit') {
      log.info('Setup cancelled.');
      break;
    }
    
    if (selectedAgent.name === 'manual') {
      log.title('\n📖 Manual Configuration');
      console.log('For manual configuration instructions, see:');
      console.log(`${colors.cyan}docs/guides/coding-agents-setup.md${colors.reset}`);
      console.log('\nThis file contains detailed setup instructions for:');
      console.log('• Claude Desktop, Cursor IDE, Windsurf IDE');
      console.log('• Continue (VS Code), Cody (Sourcegraph)');
      console.log('• GitHub Copilot Chat, JetBrains AI Assistant');
      console.log('• Docker-based setup for all tools');
      continue;
    }
    
    const success = await setupAgent(selectedAgent.name, selectedAgent.displayName);
    
    if (success) {
      const continueSetup = await question('\nWould you like to configure another tool? (y/n): ');
      if (continueSetup.toLowerCase() !== 'y') {
        break;
      }
    }
  }
  
  log.title('\n🎉 Setup Complete!');
  log.info('Your TestRail MCP Server is now configured with your AI coding tools.');
  log.subtitle('For troubleshooting and advanced configuration, see docs/guides/coding-agents-setup.md');
  
  rl.close();
}

// Handle script interruption
process.on('SIGINT', () => {
  log.info('\nSetup interrupted.');
  rl.close();
  process.exit(0);
});

// Run the setup
main().catch((error) => {
  log.error(`Setup failed: ${error.message}`);
  process.exit(1);
});