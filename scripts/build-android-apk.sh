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
VERSION=$(jq -r '.version' package.json)
APK_FILENAME="ai-dict-${VERSION}.apk"

# 署名済みAPKが存在する場合はそれを使用、なければ未署名APKを使用
if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
  APK_FILE="android/app/build/outputs/apk/release/app-release.apk"
  echo "✅ Found signed APK: $APK_FILE"
elif [ -f "android/app/build/outputs/apk/release/app-release-unsigned.apk" ]; then
  APK_FILE="android/app/build/outputs/apk/release/app-release-unsigned.apk"
  echo "⚠️  Found unsigned APK: $APK_FILE"
else
  echo "❌ No APK file found"
  exit 1
fi
cp "$APK_FILE" "public/releases/${APK_FILENAME}"

# Step 5: Update version info
APK_SIZE=$(du -h "public/releases/${APK_FILENAME}" | cut -f1)
BUILD_DATE=$(date "+%Y-%m-%d %H:%M:%S")

# Create release info file
cat > public/releases/release-info.json << EOF
{
  "version": "$VERSION",
  "size": "$APK_SIZE",
  "buildDate": "$BUILD_DATE",
  "filename": "$APK_FILENAME",
  "signed": true,
  "minSdkVersion": 24,
  "targetSdkVersion": 36
}
EOF

echo "✅ APK build completed successfully!"
echo "📄 APK location: public/releases/${APK_FILENAME}"
echo "📊 APK size: $APK_SIZE"
echo "🏷️  Version: $VERSION"