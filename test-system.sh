#!/bin/bash

# Comprehensive system test for Background Auto-Apply feature
# Tests backend, agent service, and Ollama integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "=================================="
echo "LinkedIn Job Swipe - System Test"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Agent Service - Orchestrator Import
echo "Test 1: Agent Service Orchestrator"
if docker exec agent-service python -c "from chains.orchestrator_chain import run_orchestrator_chain; print('OK')" > /dev/null 2>&1; then
    success "Orchestrator chain can be imported"
else
    error "Orchestrator chain import failed"
    exit 1
fi

# Test 2: gRPC Port
echo "Test 2: gRPC Server"
if lsof -i:50051 > /dev/null 2>&1; then
    success "Agent service listening on port 50051"
else
    error "Agent service not listening on port 50051"
    exit 1
fi

# Test 3: Backend API
echo "Test 3: Backend API"
if curl -s http://localhost:5001/api/jobs > /dev/null 2>&1; then
    success "Backend API accessible"
else
    error "Backend API not accessible"
    exit 1
fi

# Test 4: Ollama
echo "Test 4: Ollama LLM Service"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    success "Ollama is running"

    # Check for fast model
    if curl -s http://localhost:11434/api/tags | grep -q "llama3.2:3b"; then
        success "Fast model (llama3.2:3b) is available"
    elif curl -s http://localhost:11434/api/tags | grep -q "llama3.2"; then
        warning "Standard model found. For better performance, run:"
        echo "  docker exec ollama ollama pull llama3.2:3b"
    else
        warning "No llama3.2 model found. Run:"
        echo "  docker exec ollama ollama pull llama3.2:3b"
    fi
else
    error "Ollama not accessible"
    exit 1
fi

# Test 5: MongoDB
echo "Test 5: MongoDB Connection"
if lsof -i:27017 > /dev/null 2>&1; then
    success "MongoDB is running"
else
    warning "MongoDB not detected on port 27017 (might be using Atlas)"
fi

# Test 6: End-to-End Integration Test (optional)
echo ""
echo "Test 6: End-to-End Integration (optional)"
read -p "Run full integration test? (takes ~20 seconds) [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running integration test..."

    # Create temporary test script
    cat > /tmp/test-integration.js << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
require('./backend/models/User');
require('./backend/models/Job');
require('./backend/models/Company');
const { autoApply } = require('./backend/services/agentClient');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const User = mongoose.model('User');
    const Job = mongoose.model('Job');

    const user = await User.findOne({ 'additionalInfo.autoApply': true });
    if (!user) {
      console.log('No user with auto-apply enabled. Run: node enable-auto-apply.js YOUR_EMAIL');
      process.exit(1);
    }

    const job = await Job.findOne().populate('company', 'name');
    if (!job) {
      console.log('No jobs in database');
      process.exit(1);
    }

    const payload = {
      job: {
        id: job._id.toString(),
        title: job.title,
        company: job.company?.name || '',
        location: job.location,
        description: job.description || '',
        salary: '',
        type: job.jobType || '',
        experience: '',
        easy_apply: true
      },
      profile: {
        name: user.username,
        email: user.email,
        resume_text: `Name: ${user.username}\nEmail: ${user.email}\nPhone: ${user.phoneNumber || 'N/A'}`,
        headline: '',
        summary: '',
        skills: []
      },
      questions: []
    };

    const result = await autoApply(payload);

    if (result.success) {
      console.log('✓ Integration test passed');
      console.log(`  Resume: ${result.refined_resume.length} chars`);
      console.log(`  Cover letter: ${result.cover_letter.length} chars`);
      process.exit(0);
    } else {
      console.log('✗ Integration test failed:', result.message);
      process.exit(1);
    }
  } catch (err) {
    console.log('✗ Integration test error:', err.message);
    process.exit(1);
  }
})();
EOF

    cd "$SCRIPT_DIR"
    if node /tmp/test-integration.js 2>/dev/null; then
        success "Integration test passed"
    else
        error "Integration test failed"
        echo "  This might be because:"
        echo "  - No user with auto-apply enabled (run: node enable-auto-apply.js YOUR_EMAIL)"
        echo "  - No jobs in database"
        echo "  - Ollama is slow or unresponsive"
    fi
    rm -f /tmp/test-integration.js
else
    warning "Integration test skipped"
fi

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo ""
success "All critical services are running"
echo ""
echo "Next steps:"
echo "  1. Enable auto-apply: node enable-auto-apply.js YOUR_EMAIL"
echo "  2. Start frontend: cd frontend && npm start"
echo "  3. Test by swiping right on a job"
echo ""
echo "For troubleshooting, see:"
echo "  - Frontend: frontend/README.md"
echo "  - Backend: backend/README.md"
echo "  - Agent Service: agent-service/README.md"
echo "=================================="
