#!/bin/bash
# sync-upstream.sh - Sync fork with upstream repository
# Usage: ./scripts/sync-upstream.sh [branch]

set -e

BRANCH="${1:-main}"
UPSTREAM="upstream"
ORIGIN="origin"

echo "🔄 Syncing fork with upstream..."
echo "   Branch: $BRANCH"
echo "   Upstream: $UPSTREAM"
echo "   Origin: $ORIGIN"
echo ""

# Fetch latest from upstream
echo "📥 Fetching from upstream..."
git fetch $UPSTREAM

# Checkout target branch
echo "📌 Checking out $BRANCH..."
git checkout $BRANCH

# Merge upstream changes
echo "🔗 Merging $UPSTREAM/$BRANCH into $BRANCH..."
git merge $UPSTREAM/$BRANCH --no-edit

# Push to origin
echo "📤 Pushing to $ORIGIN/$BRANCH..."
git push $ORIGIN $BRANCH

echo ""
echo "✅ Sync complete!"
echo "   $BRANCH is now synced with $UPSTREAM/$BRANCH"
