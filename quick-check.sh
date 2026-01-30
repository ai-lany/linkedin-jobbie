#!/bin/bash
# Quick sanity check

echo "🔍 Quick System Check"
echo "===================="
echo ""

echo "1. Services Status:"
docker ps --filter "name=agent-service" --format "   Agent: {{.Status}}"
lsof -i :5001 >/dev/null 2>&1 && echo "   Backend: Running on :5001" || echo "   Backend: ❌ NOT running"
lsof -i :50051 >/dev/null 2>&1 && echo "   gRPC: Listening on :50051" || echo "   gRPC: ❌ NOT listening"
echo ""

echo "2. Backend auto-apply endpoint exists:"
if grep -q "auto-apply/:jobId" /Users/agaguila/Documents/HackWeek/linkedin-jobbie/backend/routes/api/agent.js; then
    echo "   ✅ Route defined"
else
    echo "   ❌ Route NOT found"
fi
echo ""

echo "3. Backend has refinedResume field:"
if grep -q "refinedResume" /Users/agaguila/Documents/HackWeek/linkedin-jobbie/backend/routes/api/agent.js; then
    echo "   ✅ Code updated"
else
    echo "   ❌ Code NOT updated"
fi
echo ""

echo "4. Agent service logs buffer:"
if docker exec agent-service printenv PYTHONUNBUFFERED | grep -q "1"; then
    echo "   ✅ Unbuffered (logs work)"
else
    echo "   ⚠️  May be buffered"
fi
echo ""

echo "5. Frontend auto-apply handler:"
if grep -q "handleAutoApply" /Users/agaguila/Documents/HackWeek/linkedin-jobbie/frontend/app/\(tabs\)/index.tsx; then
    echo "   ✅ Handler exists"
    # Check if it calls the agent endpoint
    if grep -q "agent/auto-apply" /Users/agaguila/Documents/HackWeek/linkedin-jobbie/frontend/app/\(tabs\)/index.tsx; then
        echo "   ✅ Calls agent/auto-apply endpoint"
    else
        echo "   ❌ Does NOT call agent endpoint"
    fi
else
    echo "   ❌ Handler NOT found"
fi
echo ""

echo "6. Test connectivity:"
echo "   Testing backend health..."
curl -s http://localhost:5001/api/health 2>&1 | head -1 | grep -q "Cannot GET" && echo "   ✅ Backend responding" || echo "   ⚠️  No /health endpoint"
echo ""

echo "===================="
echo "💡 Next steps:"
echo "   1. Make sure you're logged in to the frontend"
echo "   2. Enable auto-apply in settings"
echo "   3. Run: ./test-auto-apply-flow.sh"
echo "   4. Or swipe right in the UI and run: docker logs agent-service -f"
