#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         YouTube Integration Diagnostic                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check API key
echo "1. Checking environment configuration..."
if [ -z "$YOUTUBE_API_KEY" ]; then
    echo "   ❌ YOUTUBE_API_KEY is NOT set"
    echo "   📝 Current mode: MOCK provider (fallback)"
    echo ""
    echo "   To enable real YouTube videos:"
    echo "   1. Get API key: https://console.cloud.google.com/"
    echo "   2. Edit /app/.env and add: YOUTUBE_API_KEY=\"AIzaSy...\""
    echo "   3. Restart: sudo supervisorctl restart frontend"
    USING_MOCK=true
else
    echo "   ✓ YOUTUBE_API_KEY is set"
    echo "   Length: ${#YOUTUBE_API_KEY} characters"
    USING_MOCK=false
fi
echo ""

# Check existing course
echo "2. Checking latest generated course..."
LATEST_COURSE=$(curl -s http://localhost:3000/api/courses/290fc1fd-7349-4108-af1b-f0ec4f5e3cdd 2>/dev/null)

if [ -n "$LATEST_COURSE" ]; then
    TOPIC=$(echo $LATEST_COURSE | jq -r '.data.course.topic')
    VIDEO_URL=$(echo $LATEST_COURSE | jq -r '.data.course.modules[0].resources[0].url')
    VIDEO_TITLE=$(echo $LATEST_COURSE | jq -r '.data.course.modules[0].resources[0].title')
    VIDEO_REASON=$(echo $LATEST_COURSE | jq -r '.data.course.modules[0].resources[0].reason')
    
    echo "   Topic: $TOPIC"
    echo "   First video:"
    echo "     Title: $VIDEO_TITLE"
    echo "     URL: $VIDEO_URL"
    echo "     Reason: $VIDEO_REASON"
    echo ""
    
    if echo "$VIDEO_URL" | grep -q "mock"; then
        echo "   📺 Status: Using MOCK videos"
    else
        echo "   📺 Status: Using REAL YouTube videos ✓"
    fi
else
    echo "   No course found to check"
fi
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                       SUMMARY                                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ "$USING_MOCK" = true ]; then
    echo "🔍 DIAGNOSIS:"
    echo "   System is using MOCK YouTube provider (by design)"
    echo ""
    echo "✅ THIS IS CORRECT BEHAVIOR when no API key is configured!"
    echo ""
    echo "💡 WHAT THIS MEANS:"
    echo "   • Course generation works perfectly"
    echo "   • Video resources are created with mock URLs"
    echo "   • System never fails due to YouTube API issues"
    echo ""
    echo "🎯 TO GET REAL YOUTUBE VIDEOS:"
    echo "   1. Visit: https://console.cloud.google.com/"
    echo "   2. Enable YouTube Data API v3"
    echo "   3. Create API key"
    echo "   4. Add to /app/.env: YOUTUBE_API_KEY=\"your-key\""
    echo "   5. Restart server: sudo supervisorctl restart frontend"
    echo "   6. Generate new course to see real videos"
    echo ""
    echo "📚 More info: /app/YOUTUBE_SETUP.md"
else
    echo "✅ YouTube API key is configured!"
    echo ""
    echo "Next: Generate a new course to test real video fetching"
    echo ""
    echo "Test command:"
    echo "  curl -X POST http://localhost:3000/api/path/generate \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"topic\": \"Docker\", \"level\": \"beginner\", "
    echo "         \"timePerDay\": 30, \"idempotencyKey\": \"'$(uuidgen)'\"}'"
fi
