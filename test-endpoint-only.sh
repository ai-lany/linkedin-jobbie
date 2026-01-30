#!/bin/bash
# Test just the endpoint without auth

echo "🧪 Testing auto-apply endpoint availability"
echo ""

# Test with invalid token - should get 401 or error, not 404
echo "Testing: POST /api/agent/auto-apply/test-id"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/agent/auto-apply/test-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

echo "Response Code: $HTTP_CODE"
echo "Response Body: $BODY"
echo ""

if [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Route not found (404) - endpoint not registered"
    echo "   Backend may need restart"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Route exists (401 Unauthorized)"
    echo "   This is expected - endpoint is working, just needs valid auth"
elif [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "500" ]; then
    echo "✅ Route exists (error $HTTP_CODE)"
    echo "   Endpoint is registered and processing requests"
else
    echo "⚠️  Got $HTTP_CODE - unexpected"
fi
echo ""

# Also test the cover-letter endpoint as comparison
echo "Comparing with cover-letter endpoint..."
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:5001/api/agent/cover-letter \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token")

HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
echo "cover-letter endpoint: $HTTP_CODE2"
echo ""

if [ "$HTTP_CODE" = "$HTTP_CODE2" ]; then
    echo "✅ Both endpoints respond the same way - likely working correctly"
else
    echo "⚠️  Different responses - auto-apply may have issues"
fi
