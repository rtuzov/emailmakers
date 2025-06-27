#!/bin/bash

# Email-Makers API Test Script
# This script tests all the main API endpoints to ensure they're working correctly

BASE_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Email-Makers API Test Suite${NC}"
echo "======================================"

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "\n${YELLOW}Testing:${NC} $description"
    echo "Endpoint: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract HTTP status code (last line)
    http_code=$(echo "$response" | tail -n1)
    # Extract response body (all but last line)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        echo "Response preview: $(echo "$body" | jq -r '.message // .success // "Response received"' 2>/dev/null || echo "Response received")"
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        echo "Error: $body"
        return 1
    fi
    
    return 0
}

# Test counter
total_tests=0
passed_tests=0

# Test 1: Main API endpoint
total_tests=$((total_tests + 1))
if test_endpoint "GET" "" "Main API information"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 2: Template generation endpoint info
total_tests=$((total_tests + 1))
if test_endpoint "GET" "/templates/generate" "Template generation info"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 3: Template generation
total_tests=$((total_tests + 1))
template_data='{"content": "Create a welcome email for new users", "title": "Welcome Email", "type": "text"}'
if test_endpoint "POST" "/templates/generate" "Generate email template" "$template_data"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 4: Content validation endpoint info
total_tests=$((total_tests + 1))
if test_endpoint "GET" "/content/validate" "Content validation info"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 5: Content validation
total_tests=$((total_tests + 1))
content_data='{"content": "Welcome to our platform! We are excited to have you.", "type": "text"}'
if test_endpoint "POST" "/content/validate" "Validate content brief" "$content_data"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 6: Design system endpoint info
total_tests=$((total_tests + 1))
if test_endpoint "GET" "/design-system/extract" "Design system extraction info"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 7: Design system extraction
total_tests=$((total_tests + 1))
figma_data='{"figmaUrl": "https://www.figma.com/file/abc123def456/Test-Design-System"}'
if test_endpoint "POST" "/design-system/extract" "Extract design system" "$figma_data"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 8: Quality validation endpoint info
total_tests=$((total_tests + 1))
if test_endpoint "GET" "/quality/validate" "Quality validation info"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 9: Quality validation
total_tests=$((total_tests + 1))
html_data='{"html": "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Welcome</h1><p>This is a test email.</p><a href=\"#\">Click here</a></body></html>"}'
if test_endpoint "POST" "/quality/validate" "Validate email quality" "$html_data"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 10: Template generation with Figma URL
total_tests=$((total_tests + 1))
figma_template_data='{"content": "Create a product announcement email", "title": "Product Launch", "type": "figma_url", "options": {"figmaUrl": "https://www.figma.com/file/test123/Product-Launch", "campaignType": "promotional"}}'
if test_endpoint "POST" "/templates/generate" "Generate template with Figma" "$figma_template_data"; then
    passed_tests=$((passed_tests + 1))
fi

# Summary
echo -e "\n${YELLOW}======================================"
echo "📊 Test Results Summary"
echo "======================================${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 All tests passed! ($passed_tests/$total_tests)${NC}"
    echo -e "${GREEN}✅ Email-Makers API is fully operational${NC}"
else
    echo -e "${RED}⚠️  Some tests failed ($passed_tests/$total_tests passed)${NC}"
    echo -e "${YELLOW}📝 Check the failed endpoints above${NC}"
fi

echo -e "\n${YELLOW}🔗 API Documentation:${NC} See API_ENDPOINTS.md for detailed documentation"
echo -e "${YELLOW}🌐 Main API URL:${NC} $BASE_URL"
echo -e "${YELLOW}📋 Available endpoints:${NC}"
echo "  • GET  /api                     - API information"
echo "  • POST /api/templates/generate  - Generate email templates"
echo "  • POST /api/content/validate    - Validate content briefs"
echo "  • POST /api/design-system/extract - Extract Figma design systems"
echo "  • POST /api/quality/validate    - Validate email quality"
echo "  • POST /api/auth/register       - Register user"
echo "  • POST /api/auth/login          - Login user"
echo "  • POST /api/auth/logout         - Logout user"
echo "  • GET  /api/auth/me             - Get current user"

# Exit with appropriate code
if [ $passed_tests -eq $total_tests ]; then
    exit 0
else
    exit 1
fi 