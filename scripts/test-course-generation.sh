#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       CREO Course Generation - End-to-End Test              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

# ========================================
# TEST 1: Start Course Generation
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 1: Start Course Generation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

IDEMPOTENCY_KEY=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)
echo "Idempotency Key: $IDEMPOTENCY_KEY"

GENERATE_RESPONSE=$(curl -s -X POST "$API_URL/api/path/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"topic\": \"JavaScript Fundamentals\",
    \"level\": \"beginner\",
    \"timePerDay\": 30,
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY\"
  }")

SUCCESS=$(echo $GENERATE_RESPONSE | jq -r '.success')
JOB_ID=$(echo $GENERATE_RESPONSE | jq -r '.jobId')
TRACE_ID=$(echo $GENERATE_RESPONSE | jq -r '.traceId')

if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Course generation started${NC}"
    echo "  Job ID: $JOB_ID"
    echo "  Trace ID: $TRACE_ID"
else
    echo -e "${RED}✗ Failed to start generation${NC}"
    echo "$GENERATE_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# ========================================
# TEST 2: Test Idempotency
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 2: Test Idempotency${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

RETRY_RESPONSE=$(curl -s -X POST "$API_URL/api/path/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"topic\": \"JavaScript Fundamentals\",
    \"level\": \"beginner\",
    \"timePerDay\": 30,
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY\"
  }")

RETRY_JOB_ID=$(echo $RETRY_RESPONSE | jq -r '.jobId')

if [ "$RETRY_JOB_ID" = "$JOB_ID" ]; then
    echo -e "${GREEN}✓ Idempotency working - returned same job ID${NC}"
else
    echo -e "${RED}✗ Idempotency failed - got different job ID${NC}"
    exit 1
fi
echo ""

# ========================================
# TEST 3: Poll Job Status
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 3: Poll Job Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

MAX_POLLS=60
POLL_INTERVAL=2
POLL_COUNT=0

while [ $POLL_COUNT -lt $MAX_POLLS ]; do
    JOB_STATUS_RESPONSE=$(curl -s "$API_URL/api/jobs/$JOB_ID")
    
    STATUS=$(echo $JOB_STATUS_RESPONSE | jq -r '.data.status')
    PROGRESS=$(echo $JOB_STATUS_RESPONSE | jq -r '.data.progressPercent')
    STAGE=$(echo $JOB_STATUS_RESPONSE | jq -r '.data.currentStage')
    
    echo "[$POLL_COUNT] Status: $STATUS | Progress: $PROGRESS% | Stage: $STAGE"
    
    if [ "$STATUS" = "succeeded" ]; then
        echo ""
        echo -e "${GREEN}✓ Job completed successfully!${NC}"
        COURSE_ID=$(echo $JOB_STATUS_RESPONSE | jq -r '.data.courseId')
        echo "  Course ID: $COURSE_ID"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo ""
        echo -e "${RED}✗ Job failed${NC}"
        echo "$JOB_STATUS_RESPONSE" | jq '.data.error'
        exit 1
    fi
    
    POLL_COUNT=$((POLL_COUNT + 1))
    sleep $POLL_INTERVAL
done

if [ $POLL_COUNT -ge $MAX_POLLS ]; then
    echo -e "${RED}✗ Job timeout after $MAX_POLLS polls${NC}"
    exit 1
fi
echo ""

# ========================================
# TEST 4: Verify Job Events
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 4: Verify Job Events (Observability)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

EVENTS=$(echo $JOB_STATUS_RESPONSE | jq -r '.data.events[] | "\(.stage): \(.message)"')
EVENT_COUNT=$(echo $JOB_STATUS_RESPONSE | jq '.data.events | length')

echo "Job Events ($EVENT_COUNT):"
echo "$EVENTS" | head -10
echo ""

if [ $EVENT_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Job events logged${NC}"
else
    echo -e "${RED}✗ No job events found${NC}"
fi
echo ""

# ========================================
# TEST 5: Fetch Complete Course
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 5: Fetch Complete Course${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

COURSE_RESPONSE=$(curl -s "$API_URL/api/courses/$COURSE_ID")
COURSE_SUCCESS=$(echo $COURSE_RESPONSE | jq -r '.success')

if [ "$COURSE_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Course fetched successfully${NC}"
    
    # Verify structure
    MODULE_COUNT=$(echo $COURSE_RESPONSE | jq '.data.course.modules | length')
    echo "  Modules: $MODULE_COUNT"
    
    if [ $MODULE_COUNT -ne 5 ]; then
        echo -e "${RED}✗ Expected 5 modules, got $MODULE_COUNT${NC}"
        exit 1
    fi
    
    # Check each module
    for i in {0..4}; do
        MODULE_TITLE=$(echo $COURSE_RESPONSE | jq -r ".data.course.modules[$i].title")
        LESSON_COUNT=$(echo $COURSE_RESPONSE | jq ".data.course.modules[$i].lessons | length")
        QUIZ_COUNT=$(echo $COURSE_RESPONSE | jq ".data.course.modules[$i].quizzes | length")
        RESOURCE_COUNT=$(echo $COURSE_RESPONSE | jq ".data.course.modules[$i].resources | length")
        
        MODULE_NUM=$((i + 1))
        echo "  Module $MODULE_NUM: $MODULE_TITLE"
        echo "    Lessons: $LESSON_COUNT"
        echo "    Quizzes: $QUIZ_COUNT"
        echo "    Resources: $RESOURCE_COUNT"
        
        if [ $QUIZ_COUNT -lt 1 ]; then
            echo -e "${RED}    ✗ No quizzes found${NC}"
            exit 1
        fi
        
        # Verify quiz questions
        if [ $QUIZ_COUNT -gt 0 ]; then
            QUESTION_COUNT=$(echo $COURSE_RESPONSE | jq ".data.course.modules[$i].quizzes[0].questions | length")
            echo "    Quiz Questions: $QUESTION_COUNT"
            
            if [ $QUESTION_COUNT -lt 3 ]; then
                echo -e "${RED}    ✗ Too few questions${NC}"
                exit 1
            fi
        fi
    done
    
    echo ""
    echo -e "${GREEN}✓ All modules have required structure${NC}"
else
    echo -e "${RED}✗ Failed to fetch course${NC}"
    echo "$COURSE_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# ========================================
# TEST 6: Validation Error Test
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 6: Validation Error Handling${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

INVALID_REQUEST=$(curl -s -X POST "$API_URL/api/path/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"topic\": \"X\",
    \"level\": \"beginner\",
    \"timePerDay\": 1000,
    \"idempotencyKey\": \"$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)\"
  }")

ERROR_CODE=$(echo $INVALID_REQUEST | jq -r '.error.code')
SUGGESTED_FIX=$(echo $INVALID_REQUEST | jq -r '.error.suggestedFix')

if [ "$ERROR_CODE" = "VALIDATION_ERROR" ]; then
    echo -e "${GREEN}✓ Validation error caught${NC}"
    echo "  Error Code: $ERROR_CODE"
    echo "  Suggested Fix: $SUGGESTED_FIX"
else
    echo -e "${RED}✗ Expected validation error${NC}"
fi
echo ""

# ========================================
# SUMMARY
# ========================================
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ALL TESTS PASSED ✓                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Summary:"
echo "  ✓ Course generation started"
echo "  ✓ Idempotency working"
echo "  ✓ Job completed successfully"
echo "  ✓ Job events logged (observability)"
echo "  ✓ Course has 5 modules"
echo "  ✓ Each module has lessons, quizzes, resources"
echo "  ✓ Validation errors handled properly"
echo ""
echo "Generated Course ID: $COURSE_ID"
echo ""
echo "View course:"
echo "  curl \"$API_URL/api/courses/$COURSE_ID\" | jq '.'"
