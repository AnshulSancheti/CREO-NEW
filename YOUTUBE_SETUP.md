# YouTube Video Integration - Setup Guide

## Current Status

The system is working correctly with **mock YouTube videos** as fallback since no API key is configured.

### What You're Seeing Now

Mock videos like:
```
Title: "JavaScript Fundamentals - Tutorial Part 1"
URL: https://youtube.com/watch?v=mock_1_...
Channel: "Learning Channel"
Reason: "Mock video for: ... (YouTube API not configured)"
```

---

## How to Enable Real YouTube Videos

### Step 1: Get YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### Step 2: Add API Key to Environment

Edit `/app/.env`:

```bash
YOUTUBE_API_KEY="AIzaSy..."  # Your actual key here
```

### Step 3: Restart Server

```bash
sudo supervisorctl restart frontend
```

### Step 4: Test with Real Videos

```bash
# Generate a new course
curl -X POST http://localhost:3000/api/path/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Python Programming",
    "level": "beginner",
    "timePerDay": 30,
    "idempotencyKey": "'$(uuidgen)'"
  }'
```

---

## Quick Test Script

Create a test to verify YouTube integration:

```bash
#!/bin/bash
# Test if YouTube API is working

echo "Testing YouTube Provider..."

# Check if API key is set
if [ -z "$YOUTUBE_API_KEY" ]; then
    echo "⚠️  YOUTUBE_API_KEY not set - using mock provider"
else
    echo "✓ YOUTUBE_API_KEY found"
fi

# Generate a course and check resources
echo ""
echo "Generating test course..."

IDEMPOTENCY_KEY=$(uuidgen)
RESPONSE=$(curl -s -X POST http://localhost:3000/api/path/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"topic\": \"Docker Containers\",
    \"level\": \"beginner\",
    \"timePerDay\": 20,
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY\"
  }")

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

echo "Job ID: $JOB_ID"
echo "Waiting for completion..."

# Poll until complete
while true; do
    STATUS=$(curl -s http://localhost:3000/api/jobs/$JOB_ID | jq -r '.data.status')
    if [ "$STATUS" = "succeeded" ]; then
        break
    elif [ "$STATUS" = "failed" ]; then
        echo "❌ Job failed"
        exit 1
    fi
    sleep 2
done

COURSE_ID=$(curl -s http://localhost:3000/api/jobs/$JOB_ID | jq -r '.data.courseId')

echo "Course ID: $COURSE_ID"
echo ""
echo "Checking video resources..."

# Check first video
VIDEO=$(curl -s http://localhost:3000/api/courses/$COURSE_ID | jq '.data.course.modules[0].resources[0]')

echo "$VIDEO" | jq '.'

# Check if mock or real
IS_MOCK=$(echo "$VIDEO" | jq -r '.url' | grep -c "mock")

if [ $IS_MOCK -eq 1 ]; then
    echo ""
    echo "⚠️  Using MOCK videos"
    echo "To enable real YouTube videos:"
    echo "1. Get API key from https://console.cloud.google.com/"
    echo "2. Add to /app/.env: YOUTUBE_API_KEY=\"your-key\""
    echo "3. Restart: sudo supervisorctl restart frontend"
else
    echo ""
    echo "✓ Using REAL YouTube videos!"
fi
```

Save as `/app/scripts/test-youtube.sh` and run:
```bash
chmod +x /app/scripts/test-youtube.sh
bash /app/scripts/test-youtube.sh
```

---

## Why Mock Videos Are Used

Mock videos are a **fallback mechanism** to ensure the system never fails:

1. **No API Key Set** → Uses mock provider
2. **API Key Invalid** → Falls back to mock
3. **Rate Limit Exceeded** → Falls back to mock
4. **Network Error** → Falls back to mock

This is intentional - YouTube failures should never break course generation.

---

## Summary

✅ **Current behavior is correct** - mock videos work as fallback  
✅ **To get real videos**: Add YOUTUBE_API_KEY to .env  
✅ **System never fails**: Always falls back to mock on error  
✅ **Free tier**: ~6-7 courses per day  

**Add API key to enable real YouTube video fetching!**
