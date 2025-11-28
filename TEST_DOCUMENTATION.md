# Insurance Verification System - Test Documentation

## Overview

This document provides comprehensive information about the test suite for the Insurance Verification System. The test suite ensures the reliability, security, and performance of all system components.

## Test Structure

```
tests/
├── package.json              # Test dependencies and configuration
├── setup.js                  # Global test setup and teardown
├── unit/                     # Unit tests
│   ├── migration-smoke.test.js
│   ├── model-associations.test.js
│   └── rbac.test.js
├── integration/              # Integration tests
│   └── api-endpoints.test.js
├── e2e/                      # End-to-end tests
│   └── golden-path.test.js
└── test.db                   # SQLite test database (auto-generated)
```

## Test Categories

### 1. Unit Tests

#### Migration Smoke Tests (`migration-smoke.test.js`)
- **Purpose**: Verify database schema integrity and migration success
- **Coverage**:
  - All table creation and structure validation
  - New role enum values (admin, company, officer, cbl, insurer, insured)
  - New columns in existing tables
  - Foreign key relationships
  - Data type validation

#### Model Association Tests (`model-associations.test.js`)
- **Purpose**: Test Sequelize model relationships and constraints
- **Coverage**:
  - User-Company associations
  - Policy-Company associations
  - Verification-Policy-Officer associations
  - Claim-Policy associations
  - Statement-Policy associations
  - Bond-Policy associations
  - Cascade delete operations
  - Foreign key constraints

#### RBAC Service Tests (`rbac.test.js`)
- **Purpose**: Validate role-based access control implementation
- **Coverage**:
  - Permission matrix for all roles
  - Role hierarchy validation
  - Resource access control
  - Permission checking functions
  - Role validation functions

### 2. Integration Tests

#### API Endpoint Tests (`api-endpoints.test.js`)
- **Purpose**: Test API endpoints with authentication and authorization
- **Coverage**:
  - Authentication flow (login/logout)
  - Admin API endpoints
  - Company API endpoints
  - Officer API endpoints
  - CBL API endpoints
  - Insurer API endpoints
  - Insured API endpoints
  - Policy numbering service
  - Upload service
  - Error handling and validation

### 3. End-to-End Tests

#### Golden Path Tests (`golden-path.test.js`)
- **Purpose**: Test complete user workflows from start to finish
- **Coverage**:
  - Complete insurance verification workflow
  - Policy creation with auto-generated numbers
  - File upload workflows
  - Role-based access control throughout workflows
  - Error scenario handling
  - Performance and load testing
  - Concurrent operations

## Test Configuration

### Environment Variables
```bash
NODE_ENV=test
DB_DIALECT=sqlite
DB_STORAGE=tests/test.db
```

### Jest Configuration
```json
{
  "testEnvironment": "node",
  "testMatch": ["**/tests/**/*.test.js"],
  "collectCoverageFrom": [
    "server/**/*.js",
    "!server/index.js",
    "!server/migrations/**",
    "!server/seeders/**"
  ],
  "coverageDirectory": "coverage",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
}
```

## Running Tests

### Prerequisites
1. Node.js 18+ installed
2. Project dependencies installed (`npm install`)
3. Test dependencies installed (`cd tests && npm install`)

### Test Commands

#### Run All Tests
```bash
./run-tests.sh
```

#### Run Specific Test Suites
```bash
# Unit tests only
cd tests && npm run test:unit

# Integration tests only
cd tests && npm run test:integration

# E2E tests only
cd tests && npm run test:e2e

# Specific test file
cd tests && npm test -- tests/unit/migration-smoke.test.js
```

#### Run Tests with Coverage
```bash
cd tests && npm run test:coverage
```

#### Run Tests in Watch Mode
```bash
cd tests && npm run test:watch
```

## Test Data Management

### Database Setup
- Each test suite uses a fresh SQLite database
- Global setup creates all required tables
- Each test cleans up its data after completion
- Foreign key constraints are properly tested

### Test Users
The test suite creates users for each role:
- **admin**: Full system access
- **company**: Company management and policy creation
- **officer**: Document verification
- **cbl**: CBL-specific operations
- **insurer**: Insurance company operations
- **insured**: Policy holder operations

### Mock Data
- Realistic test data for all entities
- Proper relationships between entities
- Edge cases and error scenarios
- Performance test data sets

## Coverage Requirements

### Minimum Coverage Targets
- **Unit Tests**: 90%+ coverage for core services
- **Integration Tests**: 80%+ coverage for API endpoints
- **E2E Tests**: 100% coverage for critical user flows

### Coverage Exclusions
- Database migration files
- Seeder files
- Main server entry point
- Configuration files

## Test Scenarios

### Critical Paths Tested
1. **User Registration and Authentication**
   - Login with valid/invalid credentials
   - Token validation and refresh
   - Role-based access control

2. **Policy Management**
   - Policy creation and validation
   - Auto-generated policy numbers
   - Policy updates and deletions
   - Policy status management

3. **Document Verification**
   - Document upload and validation
   - Officer verification workflow
   - Verification status tracking
   - Location and metadata capture

4. **Claim Processing**
   - Claim reporting by insured
   - Claim processing by insurer
   - Settlement and denial workflows
   - Document attachment handling

5. **File Management**
   - Single and multiple file uploads
   - Document and image processing
   - File validation and storage
   - File retrieval and deletion

### Error Scenarios Tested
- Invalid input validation
- Authentication failures
- Authorization violations
- Database constraint violations
- File upload errors
- Network timeout handling
- Concurrent access conflicts

### Performance Scenarios Tested
- Concurrent policy creation
- Dashboard data aggregation
- Large file uploads
- Database query optimization
- Memory usage patterns

## Continuous Integration

### GitHub Actions Integration
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: cd tests && npm install
      - run: ./run-tests.sh
```

### Pre-commit Hooks
- Run unit tests before commit
- Check code coverage thresholds
- Validate test data integrity
- Ensure all tests pass

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Clear test database
rm tests/test.db
# Re-run tests
./run-tests.sh
```

#### Permission Errors
```bash
# Make test runner executable
chmod +x run-tests.sh
```

#### Dependency Issues
```bash
# Clean install
rm -rf node_modules tests/node_modules
npm install
cd tests && npm install
```

#### Test Timeout Issues
- Increase Jest timeout in configuration
- Check for infinite loops in test code
- Verify database cleanup is working

### Debug Mode
```bash
# Run tests with verbose output
cd tests && npm test -- --verbose

# Run specific test with debug
cd tests && npm test -- --testNamePattern="migration smoke" --verbose
```

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: One test per scenario
4. **Clean Setup**: Use beforeEach/afterEach for cleanup
5. **Mock External Dependencies**: Isolate units under test

### Test Data
1. **Realistic Data**: Use realistic test data
2. **Edge Cases**: Test boundary conditions
3. **Error Scenarios**: Test failure modes
4. **Clean State**: Ensure tests don't affect each other

### Performance
1. **Parallel Execution**: Run independent tests in parallel
2. **Database Optimization**: Use transactions for cleanup
3. **Resource Management**: Clean up resources properly
4. **Timeout Handling**: Set appropriate timeouts

## Maintenance

### Regular Tasks
- Update test data quarterly
- Review and update test scenarios
- Monitor test execution times
- Update dependencies regularly
- Review coverage reports

### Test Review Process
1. Code review includes test review
2. New features require new tests
3. Bug fixes require regression tests
4. Performance changes require performance tests

## Conclusion

This comprehensive test suite ensures the Insurance Verification System is reliable, secure, and performant. The tests cover all critical functionality and provide confidence in system stability for production deployment.

For questions or issues with the test suite, please refer to the troubleshooting section or contact the development team.
