#!/usr/bin/env node

/**
 * Simple TestRail Authentication Debug Script
 */

require('dotenv').config();
const https = require('https');
const { URL } = require('url');

async function debugTestRailAuth() {
  console.log('🔍 TestRail Authentication Debug\n');
  
  const baseUrl = process.env.TESTRAIL_BASE_URL;
  const username = process.env.TESTRAIL_USERNAME;
  const apiKey = process.env.TESTRAIL_API_KEY;
  
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`👤 Username: ${username}`);
  console.log(`🔑 API Key Length: ${apiKey ? apiKey.length : 0} characters`);
  console.log(`🔑 API Key Preview: ${apiKey ? apiKey.substring(0, 20) + '...' : 'Not set'}\n`);
  
  // Test 1: URL Accessibility
  console.log('🔍 Test 1: Testing URL accessibility...');
  const url = new URL('/index.php?/api/v2/get_projects', baseUrl);
  console.log(`Full URL: ${url.toString()}\n`);
  
  // Test 2: Raw HTTP Request
  console.log('🔍 Test 2: Testing raw authentication...');
  
  const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');
  console.log(`Auth header: Basic ${auth.substring(0, 20)}...\n`);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TestRail-MCP-Server/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`Response Status: ${res.statusCode}`);
      console.log(`Response Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\nResponse Body:');
        console.log(data.substring(0, 500) + (data.length > 500 ? '...' : ''));
        
        if (res.statusCode === 200) {
          console.log('\n✅ Authentication successful!');
          resolve(data);
        } else {
          console.log('\n❌ Authentication failed!');
          console.log('\n🔧 Troubleshooting suggestions:');
          console.log('1. Check if the API key is correct and hasn\'t expired');
          console.log('2. Verify the username/email is exactly as registered in TestRail');
          console.log('3. Ensure API access is enabled in TestRail user settings');
          console.log('4. Try regenerating the API key in TestRail');
          console.log('5. Check if your TestRail instance requires special permissions');
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.error('❌ Request timeout');
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run the debug test
debugTestRailAuth().catch((error) => {
  console.error('\n💡 Next steps:');
  console.error('1. Login to TestRail web interface to verify credentials');
  console.error('2. Check "My Settings" → "API Keys" section');
  console.error('3. Regenerate API key if needed');
  console.error('4. Verify account permissions and status');
  process.exit(1);
});