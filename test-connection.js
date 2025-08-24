#!/usr/bin/env node

/**
 * TestRail Connection Test Script
 * Tests the connection to TestRail with provided credentials
 */

require('dotenv').config();
const axios = require('axios');

async function testTestRailConnection() {
  console.log('🧪 Testing TestRail Connection...\n');
  
  const baseUrl = process.env.TESTRAIL_BASE_URL;
  const username = process.env.TESTRAIL_USERNAME;
  const apiKey = process.env.TESTRAIL_API_KEY;
  
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`👤 Username: ${username}`);
  console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'Not set'}\n`);
  
  if (!baseUrl || !username || !apiKey) {
    console.error('❌ Missing required environment variables!');
    console.error('Required: TESTRAIL_BASE_URL, TESTRAIL_USERNAME, TESTRAIL_API_KEY');
    process.exit(1);
  }
  
  try {
    // Test 1: Basic API connection
    console.log('🔍 Test 1: Testing basic API connection...');
    const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');
    
    const response = await axios.get(`${baseUrl}/index.php?/api/v2/get_projects`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Connection successful!');
    console.log(`📊 Found ${response.data.length} projects\n`);
    
    // Test 2: List projects
    console.log('🔍 Test 2: Listing available projects...');
    response.data.slice(0, 5).forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.name} (ID: ${project.id}) - ${project.is_completed ? 'Completed' : 'Active'}`);
    });
    
    if (response.data.length > 5) {
      console.log(`  ... and ${response.data.length - 5} more projects`);
    }
    console.log('');
    
    // Test 3: Get first project details
    if (response.data.length > 0) {
      const firstProject = response.data[0];
      console.log('🔍 Test 3: Getting project details...');
      
      const projectResponse = await axios.get(`${baseUrl}/index.php?/api/v2/get_project/${firstProject.id}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`✅ Project "${projectResponse.data.name}" details retrieved successfully`);
      console.log(`   - Suite Mode: ${projectResponse.data.suite_mode}`);
      console.log(`   - Announcement: ${projectResponse.data.announcement || 'None'}`);
      console.log(`   - Completed: ${projectResponse.data.is_completed ? 'Yes' : 'No'}\n`);
    }
    
    // Test 4: Test MCP tools initialization
    console.log('🔍 Test 4: Testing MCP tools initialization...');
    
    // Import and test the TestRail service
    const { TestrailService } = require('./dist/utils/testrail-service.js');
    const service = new TestrailService();
    
    // Test the service connection
    const projects = await service.getProjects();
    console.log(`✅ MCP Service initialized successfully`);
    console.log(`📈 MCP Service found ${projects.length} projects\n`);
    
    console.log('🎉 All tests passed! TestRail MCP Server is ready for Smithery AI!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ TestRail API connection: Working`);
    console.log(`   ✅ Authentication: Valid`);
    console.log(`   ✅ Projects accessible: ${response.data.length}`);
    console.log(`   ✅ MCP Service: Functional`);
    console.log('\n🚀 Ready for Smithery AI tool discovery!');
    
  } catch (error) {
    console.error('❌ Connection test failed!');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.error || error.response.statusText}`);
      
      if (error.response.status === 401) {
        console.error('\n🔑 Authentication failed. Please check:');
        console.error('   - TestRail username/email is correct');
        console.error('   - API key is valid and not expired');
        console.error('   - User has API access enabled in TestRail');
      } else if (error.response.status === 403) {
        console.error('\n🚫 Access forbidden. Please check:');
        console.error('   - User has sufficient permissions');
        console.error('   - Account is not locked or suspended');
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('\n🌐 Network/URL error. Please check:');
      console.error(`   - TestRail URL is correct: ${baseUrl}`);
      console.error('   - TestRail instance is accessible');
      console.error('   - No firewall blocking the connection');
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    process.exit(1);
  }
}

// Run the test
testTestRailConnection().catch(console.error);