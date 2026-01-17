#!/bin/bash

set -e

# Simplified release script for TPS hobby plugins
# Usage: ./release.sh v1.0.0

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "❌ Usage: $0 v1.0.0"
    exit 1
fi

echo "🚀 Starting release $VERSION"

# Pull latest develop branch
echo "📥 Pulling latest develop branch..."
git pull origin develop

# Create release branch
echo "🌿 Creating release branch: release/$VERSION"
git checkout -b "release/$VERSION" develop

# Update versions
echo "📝 Updating versions..."
npm version $VERSION --no-git-tag-version
sed -i.tmp "s/\"version\": \".*$/s/\"version\": \"$VERSION\"/" manifest.json
rm -f manifest.json.tmp

PKG_VERSION=${VERSION#v}
sed -i.tmp "s/\"version\": \".*$/s/\"version\": \"$PKG_VERSION\"/" package.json
rm -f package.json.tmp

# Commit version updates
echo "💾 Committing version updates..."
git add manifest.json package.json
git commit -m "chore: Bump version to $VERSION"

# Merge to main
echo "🔀 Merging to main branch..."
git checkout main
git pull origin main
git merge --no-ff "release/$VERSION" -m "chore: Release $VERSION"

# Tag the release
echo "🏷️  Tagging release $VERSION..."
git tag -a "$VERSION" -m "Release $VERSION"

# Merge back to develop
echo "🔀 Merging back to develop..."
git checkout develop
git merge --no-ff "release/$VERSION" -m "chore: Merge $VERSION back to develop"

# Push everything
echo "📤 Pushing changes..."
git push origin main
git push origin develop
git push origin "$VERSION"

# Clean up release branch
echo "🗑️  Cleaning up release branch..."
git branch -d "release/$VERSION"

echo "✅ Release $VERSION completed successfully!"
echo ""
echo "📋 GitHub Actions will create a release automatically"
echo "  - Check progress at: https://github.com/ZachTish/TPS-Projects/actions"
echo ""