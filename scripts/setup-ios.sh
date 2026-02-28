#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AI Dict - iOS Capacitor Setup Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

check_command() {
  if ! command -v "$1" &> /dev/null; then
    print_error "$1 not found. Please install it first."
    return 1
  fi
  print_success "Found: $1"
}

# Main script
print_header "AI Dict iOS Setup"

echo "This script will:"
echo "  1. Install npm dependencies"
echo "  2. Build Next.js static export"
echo "  3. Initialize Capacitor iOS"
echo "  4. Sync configuration"
echo "  5. Prepare Xcode project"
echo ""

# Check prerequisites
print_header "Checking Prerequisites"

check_command "node" || exit 1
check_command "npm" || exit 1
check_command "xcode-select" || exit 1

# Get Node version
NODE_VERSION=$(node -v)
print_success "Node: $NODE_VERSION"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  print_error "This script only works on macOS. You're on: $OSTYPE"
  exit 1
fi
print_success "macOS detected"

# Step 1: Install dependencies
print_header "Step 1/5: Installing npm dependencies"
npm install || {
  print_error "npm install failed"
  exit 1
}
print_success "Dependencies installed"

# Step 2: Build Next.js
print_header "Step 2/5: Building Next.js static export"
npm run build || {
  print_error "npm run build failed"
  exit 1
}
print_success "Static export built to ./out/"

# Verify output directory
if [ ! -d "out" ]; then
  print_error "Output directory 'out/' not found"
  exit 1
fi
print_success "Output directory verified"

# Step 3: Initialize Capacitor iOS
print_header "Step 3/5: Initializing Capacitor iOS"

if [ ! -d "ios" ]; then
  print_warning "iOS directory not found. Creating..."
  npx cap add ios || {
    print_error "capacitor add ios failed"
    exit 1
  }
  print_success "Capacitor iOS initialized"
else
  print_warning "iOS directory already exists. Skipping 'cap add'."
fi

# Step 4: Sync configuration
print_header "Step 4/5: Syncing Capacitor configuration"
npx cap sync ios || {
  print_error "capacitor sync ios failed"
  exit 1
}
print_success "Configuration synced"

# Step 5: Prepare Swift components
print_header "Step 5/5: Preparing Swift components"

SWIFT_SOURCE_DIR="ios/native-components"
SWIFT_TARGET_DIR="ios/App/App"

if [ -d "$SWIFT_SOURCE_DIR" ]; then
  print_success "Swift components found in $SWIFT_SOURCE_DIR"
  echo ""
  echo "Next steps:"
  echo "  1. Open Xcode: npm run ios:open"
  echo "  2. In Xcode, add Swift files:"
  echo "     • Right-click 'App' in navigator"
  echo "     • Select 'Add Files to App'"
  echo "     • Navigate to: ios/native-components/"
  echo "     • Select: LiquidGlassComponents.swift, LiquidGlassViewController.swift, LiquidGlassPlugin.swift"
  echo "     • Check 'Copy items if needed' ✓"
  echo "     • Target: App ✓"
  echo "     • Click 'Add'"
  echo ""
  echo "  3. Build & Run: Cmd+R in Xcode"
  echo ""
else
  print_warning "Swift components directory not found at $SWIFT_SOURCE_DIR"
fi

# Summary
print_header "Setup Complete ✓"

echo "Project ready for iOS development!"
echo ""
echo "Quick commands:"
echo "  npm run ios:open     → Open Xcode"
echo "  npm run ios:sync     → Sync after code changes"
echo "  npm run build        → Rebuild web assets"
echo ""
echo "Documentation:"
echo "  • iOS_SETUP.md           → Quick setup guide"
echo "  • iOS_COMPLETE_SETUP.md  → Comprehensive guide"
echo ""
echo "Read iOS_SETUP.md for next steps."
echo ""
