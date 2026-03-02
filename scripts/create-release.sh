#!/bin/bash

# GitHub Release Creation Script for AI Dict Android
# Usage: ./scripts/create-release.sh [version]
# Example: ./scripts/create-release.sh v0.3.0

set -e

VERSION=${1:-"v$(jq -r '.version' package.json)"}

echo "🚀 Creating GitHub release for AI Dict Android..."
echo "📋 Version: $VERSION"

# Validate version format
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
  echo "❌ Invalid version format. Use: vX.Y.Z or vX.Y.Z-beta"
  echo "   Examples: v1.0.0, v1.1.0-beta, v2.0.0-alpha"
  exit 1
fi

# Check if tag already exists
if git tag --list | grep -q "^$VERSION$"; then
  echo "❌ Tag $VERSION already exists"
  exit 1
fi

# Update package.json version
VERSION_NUMBER=${VERSION#v}
echo "📝 Updating package.json version to $VERSION_NUMBER..."
jq ".version = \"$VERSION_NUMBER\"" package.json > package.json.tmp
mv package.json.tmp package.json

# Check if there are uncommitted changes
if ! git diff --quiet; then
  echo "📝 Committing version update..."
  git add package.json
  git commit -m "chore: bump version to $VERSION"
fi

# Create and push tag
echo "🏷️  Creating tag $VERSION..."
git tag -a "$VERSION" -m "Release $VERSION

AI Dict Android $VERSION

- Automatic release build
- APK generated via GitHub Actions
- Download from: https://github.com/$(git config --get remote.origin.url | sed 's/.*:\/\/github.com\///;s/\.git$//')/releases

Built: $(date '+%Y-%m-%d %H:%M:%S')
"

echo "⬆️  Pushing tag to trigger release build..."
git push origin "$VERSION"

echo "✅ Release process started!"
echo ""
echo "📍 Next steps:"
echo "1. GitHub Actions will automatically build the APK"
echo "2. A new release will be created with the APK attached"
echo "3. Check the progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*:\/\/github.com\///;s/\.git$//')/actions"
echo "4. Release will be available at: https://github.com/$(git config --get remote.origin.url | sed 's/.*:\/\/github.com\///;s/\.git$//')/releases"
echo ""
echo "🌐 The website will automatically show the new release APK for download!"

# Optional: Open the repository in browser (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
  read -p "📱 Open GitHub repository in browser? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://github.com/$(git config --get remote.origin.url | sed 's/.*:\/\/github.com\///;s/\.git$//')"
  fi
fi