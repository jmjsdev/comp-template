#!/bin/bash

# Script to facilitate testing with npm link
# Usage: ./scripts/link-and-install.sh [target-directory]

set -e

# Colors for messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Building @jmjs/comp-template...${NC}"
npm run build

echo -e "${BLUE}🔗 Creating global npm link...${NC}"
npm link

# If a target directory is provided, go there
if [ "$1" != "" ]; then
    echo -e "${BLUE}📁 Changing to target directory: $1${NC}"
    cd "$1"
fi

echo -e "${BLUE}🔗 Linking @jmjs/comp-template in current directory...${NC}"
npm link @jmjs/comp-template

echo -e "${BLUE}⚙️  Initializing @jmjs/comp-template...${NC}"
npx template init

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${YELLOW}You can now use:${NC}"
echo -e "  ${YELLOW}npx template${NC} - to generate from templates"
echo -e "  ${YELLOW}npx template init${NC} - to reinitialize if needed" 