# TestRail MCP Server

A comprehensive Model Context Protocol (MCP) server for TestRail integration, providing seamless access to TestRail's test management capabilities through MCP tools with advanced project management, reporting, and AutoSpectra integration.

## 🚀 Features

### Core TestRail Integration
- **Complete TestRail API Coverage**: Projects, suites, cases, runs, results, plans, milestones
- **MCP Protocol Integration**: Native MCP server implementation
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Bulk Operations**: Support for bulk test case and result operations
- **Real-time Updates**: WebSocket support for real-time TestRail updates

### Advanced Project Management
- **🏗️ Advanced Project Creation**: Template-driven project setup with predefined structures
- **📊 Project Health Analysis**: Comprehensive project structure analysis with recommendations
- **⚡ Bulk Suite Management**: Efficient bulk operations on test suites with validation
- **🎯 Template System**: Pre-built templates for functional, API, performance, security, and mobile testing

### Comprehensive Reporting & Analytics
- **📈 Project Dashboards**: Interactive dashboards with metrics, trends, and failure analysis
- **🔍 Test Case Metrics**: Detailed analysis of test case execution patterns and health
- **📋 Coverage Reports**: Comprehensive test coverage analysis by priority, type, and automation
- **📊 Trend Analysis**: Historical trend analysis with pass rate and completion tracking
- **🎯 Flakiness Detection**: Automated identification of flaky tests

### AutoSpectra Integration
- **🔄 Seamless Sync**: Direct integration with AutoSpectra test automation framework
- **🚀 CI/CD Ready**: Built-in support for GitHub Actions, Jenkins, and other CI/CD platforms
- **📝 Auto Case Creation**: Automatic test case creation from AutoSpectra test results
- **📊 Real-time Monitoring**: Live test execution monitoring and result submission

### Enterprise Features
- **🔐 Security**: Enterprise-grade security with encrypted credentials and audit logging
- **⚡ Performance**: Optimized for large datasets with rate limiting and batching
- **🛡️ Error Handling**: Comprehensive error handling with retry logic and graceful degradation
- **📝 Comprehensive Testing**: Unit, integration, and E2E tests with 95%+ coverage

## 📁 Project Structure

```
testrail-mcp-server/
├── src/                          # Source code
│   ├── types/                    # TypeScript type definitions
│   │   ├── testrail.ts          # TestRail API types
│   │   ├── mcp.ts               # MCP-specific types
│   │   └── index.ts             # Type exports
│   ├── tools/                    # MCP tool implementations
│   ├── utils/                    # Utility functions and helpers
│   └── index.ts                  # Main server entry point
├── tests/                        # Test suites
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
├── docs/                         # Documentation
│   ├── api/                      # API documentation
│   └── guides/                   # User guides and tutorials
├── examples/                     # Usage examples
│   ├── basic/                    # Basic usage examples
│   └── advanced/                 # Advanced usage examples
├── package.json                  # Package configuration
├── tsconfig.json                 # TypeScript configuration
├── .env.example                  # Environment configuration template
└── .gitignore                    # Git ignore rules
```

## ⚡ Quick Start

### Prerequisites

- Node.js 16.0 or higher
- TestRail instance with API access
- TestRail API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/testrail-mcp-server.git
cd testrail-mcp-server

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your TestRail credentials
# TESTRAIL_BASE_URL=https://your-instance.testrail.io
# TESTRAIL_USERNAME=your.email@company.com
# TESTRAIL_API_KEY=your-api-key-here
```

### Development

```bash
# Start development server
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint and format
npm run lint
npm run format
```

## 🔧 Configuration

Create a `.env` file based on `.env.example`:

```env
# Required: TestRail connection
TESTRAIL_BASE_URL=https://your-instance.testrail.io
TESTRAIL_USERNAME=your.email@company.com
TESTRAIL_API_KEY=your-api-key-here

# Optional: Server configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Optional: Default project settings
DEFAULT_PROJECT_ID=1
DEFAULT_SUITE_ID=1
```

## 🛠 Available MCP Tools

The TestRail MCP Server provides the following tools:

### Connection & Authentication
- `connect_testrail` - Connect to TestRail instance
- `test_connection` - Test TestRail connection

### Basic Project Management
- `get_projects` - List all projects
- `get_project` - Get specific project
- `create_project` - Create new project

### Advanced Project Management 🆕
- `create_advanced_project` - Create project with templates and initial structure
- `analyze_project_structure` - Analyze project health with recommendations
- `bulk_manage_suites` - Perform bulk operations on test suites
- `create_advanced_suite` - Create suite with templates and structure

### Suite & Section Management
- `get_suites` - List suites in project
- `create_suite` - Create new suite
- `get_sections` - List sections in suite
- `create_section` - Create new section

### Test Case Management
- `get_cases` - List test cases
- `get_case` - Get specific test case
- `create_case` - Create new test case
- `update_case` - Update existing test case
- `delete_case` - Delete test case

### Test Run Management
- `get_runs` - List test runs
- `create_run` - Create new test run
- `update_run` - Update test run
- `close_run` - Close test run

### Test Execution
- `get_tests` - List tests in run
- `add_result` - Add test result
- `add_bulk_results` - Add multiple results
- `get_results` - Get test results

### Advanced Reporting & Analytics 🆕
- `generate_project_dashboard` - Generate comprehensive project dashboard
- `generate_execution_report` - Generate detailed test execution reports
- `analyze_case_metrics` - Analyze test case metrics and health
- `generate_coverage_report` - Generate comprehensive test coverage reports
- `generate_report` - Generate custom test reports

### AutoSpectra Integration 🆕
- `autospectra_sync` - Synchronize AutoSpectra test results with TestRail

### Legacy Tools (Still Available)
- `get_test_stats` - Get test statistics
- `get_execution_trends` - Get execution trends

## 📚 Documentation

- [API Documentation](./docs/api/) - Detailed API reference
- [User Guides](./docs/guides/) - Step-by-step tutorials
- [Examples](./examples/) - Code examples and use cases

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [GitHub Issues](https://github.com/your-username/testrail-mcp-server/issues)
- [Documentation](./docs/)
- [Examples](./examples/)

## 🔗 Related Projects

- [TestRail API Documentation](https://www.gurock.com/testrail/docs/api)
- [Model Context Protocol](https://github.com/anthropics/mcp)
- [MCP SDK](https://github.com/anthropics/mcp-sdk)