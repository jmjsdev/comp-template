#!/bin/bash

# Script to test the CLI locally with a real test project
# This creates a test-project directory, installs the local package, and runs CLI commands
# Usage: ./scripts/test-cli-local.sh

set -e

# Colors for messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT=$(pwd)
TEST_DIR="$PROJECT_ROOT/test-project"

echo -e "${BLUE}🧪 Starting local CLI test...${NC}"

# Step 1: Build the project
echo -e "${BLUE}📦 Building project...${NC}"
npm run build

# Step 2: Create tarball
echo -e "${BLUE}📦 Creating package tarball...${NC}"
TARBALL=$(npm pack 2>&1 | tail -n 1)
echo -e "${GREEN}✓ Created: $TARBALL${NC}"

# Step 3: Clean and create test directory
echo -e "${BLUE}🗑️  Cleaning old test-project...${NC}"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

# Step 4: Initialize test project
echo -e "${BLUE}📁 Initializing test project...${NC}"
cd "$TEST_DIR"
npm init -y > /dev/null 2>&1

# Step 5: Install local package
echo -e "${BLUE}📥 Installing local package...${NC}"
npm install "$PROJECT_ROOT/$TARBALL" > /dev/null 2>&1
echo -e "${GREEN}✓ Package installed${NC}"

# Step 6: Test CLI commands
echo -e "${BLUE}🧪 Testing CLI commands...${NC}"

# Test: template --version
echo -e "${YELLOW}Testing: npx template --version${NC}"
VERSION_OUTPUT=$(npx template --version 2>&1 || true)
echo -e "  Output: $VERSION_OUTPUT"

# Test: template init (non-interactive)
echo -e "${YELLOW}Testing: npx template init${NC}"
echo -e "y" | npx template init > /dev/null 2>&1 || true

# Verify files were created
if [ -d ".template" ] && [ -f "template.config.js" ]; then
    echo -e "${GREEN}✓ template init: Files created successfully${NC}"
else
    echo -e "${RED}✗ template init: Failed to create files${NC}"
    exit 1
fi

# Test: Check if templates exist
echo -e "${YELLOW}Verifying template structure...${NC}"
TEMPLATE_COUNT=$(find .template -type f -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
if [ "$TEMPLATE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $TEMPLATE_COUNT template files${NC}"
else
    echo -e "${RED}✗ No template files found${NC}"
    exit 1
fi

# Cleanup tarball
cd "$PROJECT_ROOT"
rm -f "$TARBALL"

echo -e "${GREEN}✅ All CLI tests passed!${NC}"
echo -e "${YELLOW}Test project location: $TEST_DIR${NC}"
echo -e "${YELLOW}To manually test: cd test-project && npx template${NC}"
