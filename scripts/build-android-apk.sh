#!/bin/bash

# AI Dict Android APK Build Script
# This script builds the Android APK and copies it to the public releases folder

set -e

echo "🚀 Building AI Dict Android APK..."

# Step 1: Build Next.js production files
echo "📦 Building Next.js production build..."
npm run export

# Step 2: Sync Capacitor
echo "🔄 Syncing Capacitor Android..."
npx cap sync android

# Step 3: Build Android APK
echo "🏗️  Building Android APK..."
cd android
./gradlew assembleRelease

# Step 4: Copy APK to public releases
echo "📋 Copying APK to public releases..."
cd ..
cp android/app/build/outputs/apk/release/app-release.apk public/releases/ai-dict.apk

# Step 5: Update version info
VERSION=$(jq -r '.version' package.json)
APK_SIZE=$(du -h public/releases/ai-dict.apk | cut -f1)
BUILD_DATE=$(date "+%Y-%m-%d %H:%M:%S")

# Create release info file
cat > public/releases/release-info.json << EOF
{
  "version": "$VERSION",
  "size": "$APK_SIZE",
  "buildDate": "$BUILD_DATE",
  "filename": "ai-dict.apk"
}
EOF

echo "✅ APK build completed successfully!"
echo "📄 APK location: public/releases/ai-dict.apk"
echo "📊 APK size: $APK_SIZE"
echo "🏷️  Version: $VERSION"