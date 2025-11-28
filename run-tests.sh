#!/bin/bash

# Test Runner Script for Insurance Verification System
# This script runs all tests in the correct order and provides comprehensive reporting

echo "🚀 Starting Insurance Verification System Test Suite"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run tests and track results
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    
    echo -e "\n${BLUE}Running $suite_name...${NC}"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $suite_name PASSED${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ $suite_name FAILED${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Install test dependencies if needed
if [ ! -d "tests/node_modules" ]; then
    echo -e "${YELLOW}Installing test dependencies...${NC}"
    cd tests && npm install && cd ..
fi

# Set up test environment
export NODE_ENV=test
export DB_DIALECT=sqlite
export DB_STORAGE=tests/test.db

echo -e "${YELLOW}Test Environment:${NC}"
echo "NODE_ENV: $NODE_ENV"
echo "DB_DIALECT: $DB_DIALECT"
echo "DB_STORAGE: $DB_STORAGE"

# Run test suites in order
echo -e "\n${BLUE}🧪 Running Unit Tests${NC}"
echo "========================"

run_test_suite "Migration Smoke Tests" "cd tests && npm test -- tests/unit/migration-smoke.test.js"
run_test_suite "Model Association Tests" "cd tests && npm test -- tests/unit/model-associations.test.js"
run_test_suite "RBAC Service Tests" "cd tests && npm test -- tests/unit/rbac.test.js"

echo -e "\n${BLUE}🔗 Running Integration Tests${NC}"
echo "==============================="

run_test_suite "API Endpoint Tests" "cd tests && npm test -- tests/integration/api-endpoints.test.js"

echo -e "\n${BLUE}🎯 Running E2E Tests${NC}"
echo "======================"

run_test_suite "Golden Path Tests" "cd tests && npm test -- tests/e2e/golden-path.test.js"

# Generate coverage report
echo -e "\n${BLUE}📊 Generating Coverage Report${NC}"
echo "=============================="

cd tests && npm run test:coverage && cd ..

# Final results
echo -e "\n${BLUE}📋 Test Results Summary${NC}"
echo "========================"
echo -e "Total Test Suites: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! The system is ready for production.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
