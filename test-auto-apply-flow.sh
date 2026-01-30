#!/bin/bash
# Comprehensive test for auto-apply flow

set -e

echo "=========================================="
echo "🧪 AUTO-APPLY FLOW TEST"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check services
echo "${BLUE}[1/7] Checking services...${NC}"
if docker ps | grep -q agent-service; then
    echo "  ✅ Agent service running"
else
    echo "  ❌ Agent service NOT running"
    exit 1
fi

if lsof -i :5001 | grep -q LISTEN; then
    echo "  ✅ Backend running on :5001"
else
    echo "  ❌ Backend NOT running"
    exit 1
fi

if lsof -i :50051 | grep -q LISTEN; then
    echo "  ✅ Agent gRPC listening on :50051"
else
    echo "  ❌ Agent gRPC NOT listening"
    exit 1
fi
echo ""

# Step 2: Check agent service logs are working
echo "${BLUE}[2/7] Testing agent service logging...${NC}"
docker logs agent-service 2>&1 | tail -1
echo "  ✅ Logs accessible"
echo ""

# Step 3: Get auth token (you'll need to provide this)
echo "${BLUE}[3/7] Auth token needed...${NC}"
echo "  Please provide your auth token (from frontend localStorage or login):"
read -r TOKEN
if [ -z "$TOKEN" ]; then
    echo "  ❌ No token provided"
    exit 1
fi
echo "  ✅ Token provided"
echo ""

# Step 4: Get a job ID
echo "${BLUE}[4/7] Fetching a job ID to test with...${NC}"
JOBS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

JOB_ID=$(echo "$JOBS_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"//')

if [ -z "$JOB_ID" ]; then
    echo "  ❌ Could not get job ID"
    echo "  Response: $JOBS_RESPONSE"
    exit 1
fi
echo "  ✅ Got job ID: $JOB_ID"
echo ""

# Step 5: Check if already applied
echo "${BLUE}[5/7] Checking if already applied to this job...${NC}"
APPS_RESPONSE=$(curl -s -X GET "http://localhost:5001/api/applications?job=$JOB_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$APPS_RESPONSE" | grep -q "$JOB_ID"; then
    echo "  ⚠️  Already applied to this job - will get duplicate message"
else
    echo "  ✅ Not applied yet - test will work"
fi
echo ""

# Step 6: Test auto-apply endpoint
echo "${BLUE}[6/7] Calling auto-apply endpoint...${NC}"
echo "  Endpoint: POST http://localhost:5001/api/agent/auto-apply/$JOB_ID"

# Start watching agent logs in background
echo "  📡 Starting to watch agent service logs..."
docker logs agent-service -f > /tmp/agent-logs.txt 2>&1 &
LOG_PID=$!
sleep 1

# Make the request
echo "  📤 Sending request..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:5001/api/agent/auto-apply/$JOB_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

# Wait a moment for logs
sleep 2
kill $LOG_PID 2>/dev/null || true

echo ""
echo "  Response Code: $HTTP_CODE"
echo "  Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ HTTP 200 - Request successful"
else
    echo "  ❌ HTTP $HTTP_CODE - Request failed"
fi
echo ""

# Step 7: Check agent logs
echo "${BLUE}[7/7] Checking agent service logs...${NC}"
RECENT_LOGS=$(tail -50 /tmp/agent-logs.txt)

if echo "$RECENT_LOGS" | grep -q "AUTO_APPLY"; then
    echo "  ✅ Found AUTO_APPLY logs"
    echo "$RECENT_LOGS" | grep "AUTO_APPLY"
else
    echo "  ❌ No AUTO_APPLY logs found"
    echo ""
    echo "  Recent logs:"
    echo "$RECENT_LOGS"
fi
echo ""

if echo "$RECENT_LOGS" | grep -q "AGENTIC_ORCHESTRATOR"; then
    echo "  ✅ Found AGENTIC_ORCHESTRATOR logs"
    echo "$RECENT_LOGS" | grep "AGENTIC_ORCHESTRATOR"
else
    echo "  ❌ No AGENTIC_ORCHESTRATOR logs found"
fi
echo ""

if echo "$RECENT_LOGS" | grep -q "RESUME_TOOL\|COVER_LETTER_TOOL\|QUESTIONS_TOOL"; then
    echo "  ✅ Found tool execution logs"
    echo "$RECENT_LOGS" | grep -E "RESUME_TOOL|COVER_LETTER_TOOL|QUESTIONS_TOOL"
else
    echo "  ❌ No tool execution logs found"
fi
echo ""

# Check if response contains expected fields
echo "${BLUE}Checking response data...${NC}"
if echo "$BODY" | jq -e '.application.coverLetter' >/dev/null 2>&1; then
    echo "  ✅ coverLetter present"
else
    echo "  ❌ coverLetter missing"
fi

if echo "$BODY" | jq -e '.application.refinedResume' >/dev/null 2>&1; then
    echo "  ✅ refinedResume present"
else
    echo "  ❌ refinedResume missing"
fi

if echo "$BODY" | jq -e '.application.jobQuestions' >/dev/null 2>&1; then
    echo "  ✅ jobQuestions present"
else
    echo "  ⚠️  jobQuestions missing (might not have questions)"
fi

if echo "$BODY" | jq -e '.application.phone' >/dev/null 2>&1; then
    echo "  ✅ phone present"
else
    echo "  ❌ phone missing"
fi

if echo "$BODY" | jq -e '.application.email' >/dev/null 2>&1; then
    echo "  ✅ email present"
else
    echo "  ❌ email missing"
fi
echo ""

echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo "HTTP Status: $HTTP_CODE"
echo "Agent called: $(echo "$RECENT_LOGS" | grep -q "AUTO_APPLY" && echo "YES" || echo "NO")"
echo "Tools executed: $(echo "$RECENT_LOGS" | grep -q "RESUME_TOOL" && echo "YES" || echo "NO")"
echo ""

if [ "$HTTP_CODE" = "200" ] && echo "$RECENT_LOGS" | grep -q "AUTO_APPLY"; then
    echo "${GREEN}✅ TEST PASSED - Auto-apply flow working!${NC}"
else
    echo "${RED}❌ TEST FAILED - Check logs above${NC}"
fi
echo ""

# Cleanup
rm -f /tmp/agent-logs.txt
