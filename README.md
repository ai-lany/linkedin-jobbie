# LinkedIn Job Swipe

Tinder-style job application platform with AI-powered auto-apply functionality. Swipe right to apply, swipe left to skip - the AI handles the rest.

## Features

- 🎴 **Swipeable Job Interface** - Tinder-style card UI for browsing jobs
- 🤖 **AI Auto-Apply** - Background agent generates cover letters and answers questions
- ⚡ **Non-Blocking UX** - Continue swiping while AI processes applications (~15-20s)
- 📊 **Real-Time Status** - Track applications with color-coded status badges
- 📝 **Manual Apply** - Easy Apply modal for jobs without auto-apply enabled

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐      ┌─────────┐
│   Frontend  │─────▶│   Backend   │─────▶│ Agent Service│─────▶│  Ollama │
│ React Native│ HTTP │  Node.js    │ gRPC │   Python     │ HTTP │   LLM   │
│   + Expo    │      │  + Express  │      │  + gRPC      │      │ llama3.2│
└─────────────┘      └─────────────┘      └──────────────┘      └─────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   MongoDB   │
                     │  Database   │
                     └─────────────┘
```

## Quick Start

### Prerequisites

- Node.js 16+
- Docker & Docker Compose
- MongoDB (local or Atlas)
- 8GB+ RAM (for Ollama LLM)

### 1. Clone and Install

```bash
git clone <repo-url>
cd linkedin-jobbie

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Services

```bash
# Start Agent Service + Ollama (from project root)
cd agent-service
docker-compose up -d

# Wait for Ollama to download model (~2GB, one-time)
docker exec ollama ollama pull llama3.2:3b

# Start Backend (in new terminal)
cd backend
npm run dev

# Start Frontend (in new terminal)
cd frontend
npm start
```

### 3. Verify System

```bash
# Run system test from project root
./test-system.sh
```

Expected output:
```
✓ Orchestrator chain can be imported
✓ Agent service listening on port 50051
✓ Backend API accessible
✓ Ollama is running
✓ Fast model (llama3.2:3b) is available
```

### 4. Enable Auto-Apply

```bash
# Configure user for auto-apply (from project root)
node enable-auto-apply.js YOUR_EMAIL@example.com
```

This will:
- Enable auto-apply in database
- Add dummy phone/resume if missing (for testing)
- Verify all requirements met

### 5. Test the App

1. Open frontend in browser/simulator
2. Login with the configured user
3. Swipe right on a job
4. **Expected**: No modal, card immediately transitions to next job
5. Navigate to Applications tab
6. **Expected**: Orange "Processing" badge → Green "Submitted" after ~15-20s

## Project Structure

```
linkedin-jobbie/
├── frontend/              # React Native mobile app
│   ├── app/              # Expo Router screens
│   ├── components/       # Reusable UI components
│   ├── context/          # React contexts (Auth, Jobs)
│   └── README.md         # Frontend documentation
│
├── backend/              # Node.js + Express API
│   ├── routes/           # API endpoints
│   ├── models/           # MongoDB models
│   ├── services/         # Agent gRPC client
│   └── README.md         # Backend documentation + API docs
│
├── agent-service/        # Python gRPC AI service
│   ├── chains/           # LangChain AI chains
│   │   ├── orchestrator_chain.py  # Main orchestrator
│   │   ├── resume_chain.py        # Resume tailoring
│   │   ├── cover_letter_chain.py  # Cover letter gen
│   │   └── question_answering_chain.py
│   ├── templates/        # Jinja2 prompt templates
│   ├── docker-compose.yml
│   └── README.md         # Agent service documentation
│
├── test-system.sh        # Comprehensive system test
├── enable-auto-apply.js  # User configuration tool
└── README.md            # This file
```

## Auto-Apply Flow

### User Experience

```
User swipes right
    ↓
Card transitions to next job (< 500ms)
    ↓
[User continues swiping]
    ↓
[Background: AI processes application for ~15-20s]
    ↓
Applications tab shows: Processing (🟠) → Submitted (🟢)
```

### Technical Flow

```
Frontend: applyToJob(job, data, 'pending')
    ↓
Frontend: POST /api/agent/auto-apply/:jobId
    ↓
Backend: Calls Agent Service (gRPC AutoApply)
    ↓
Agent Service: Orchestrator runs 3 chains
  ├─ Resume tailoring (~4s)
  ├─ Cover letter generation (~4s)
  └─ Question answering (~4s)
    ↓
Backend: Saves JobApplication to MongoDB
    ↓
Frontend: updateApplicationStatus(jobId, 'completed')
```

## Component Documentation

- **Frontend**: See `frontend/README.md`
  - Auto-apply UI integration
  - JobContext status management
  - Testing and troubleshooting

- **Backend**: See `backend/README.md`
  - API endpoints
  - Auto-apply route implementation
  - Agent service integration

- **Agent Service**: See `agent-service/README.md`
  - gRPC service definition
  - Orchestrator chain details
  - Model configuration

## Testing

### System Test

Run comprehensive test from project root:

```bash
./test-system.sh
```

Tests:
- ✅ Agent service orchestrator import
- ✅ gRPC server listening on port 50051
- ✅ Backend API accessible
- ✅ Ollama running with correct model
- ✅ MongoDB connection
- ✅ (Optional) End-to-end integration test

### Manual Testing

1. **Enable auto-apply**: `node enable-auto-apply.js YOUR_EMAIL`
2. **Start all services** (backend, agent, frontend)
3. **Login** with configured user
4. **Check browser console** for debug output
5. **Swipe right** on a job
6. **Verify**: No modal appears, can keep swiping
7. **Check Applications tab**: Status updates from Processing → Submitted

## Troubleshooting

### Auto-Apply Modal Still Shows

Check browser console for `canAutoApply: false`:

```javascript
🔍 Auto-apply Debug Info: {
  autoApplyEnabled: false,  // Run enable-auto-apply.js
  hasEmail: false,          // User needs email
  hasPhone: false,          // User needs phone
  hasResume: false,         // User needs resume
  hasToken: false,          // User must login
  canAutoApply: false
}
```

**Fix**: `node enable-auto-apply.js YOUR_EMAIL`

### Application Stuck in "Processing"

**Possible causes**:
- Agent service not running
- Ollama not responding
- Network error

**Debug**:
```bash
# Check agent service
docker-compose ps

# Check logs
docker logs agent-service --tail=20

# Test Ollama
curl http://localhost:11434/api/tags

# Restart services
cd agent-service
docker-compose restart
```

### Services Not Starting

**Check ports**:
```bash
lsof -i:5001  # Backend
lsof -i:50051 # Agent service
lsof -i:11434 # Ollama
lsof -i:27017 # MongoDB
```

**Restart everything**:
```bash
# Stop all
cd agent-service && docker-compose down
cd ../backend && pkill -f "node.*backend"

# Start all
cd agent-service && docker-compose up -d
cd ../backend && npm run dev
cd ../frontend && npm start
```

## Performance

- **Time to next job**: < 500ms (no blocking)
- **Agent processing**: ~15-20 seconds (background)
- **Applications per minute**: 10+ (vs 3-4 with manual apply)
- **User blocked time**: 0 seconds

## Development

### Environment Variables

**Backend** (`.env`):
```env
MONGO_URI=mongodb://localhost:27017/linkedin-job-swipe
SECRET_OR_KEY=your-secret-key
AGENT_GRPC_URL=localhost:50051
```

**Frontend** (`.env`):
```env
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

**Agent Service** (`docker-compose.yml`):
```yaml
environment:
  - OLLAMA_BASE_URL=http://ollama:11434
  - OLLAMA_MODEL=llama3.2:3b
```

### Debug Logging

Debug logs are enabled by default in `frontend/app/(tabs)/index.tsx`:

```typescript
🔍 Auto-apply Debug Info: { ... }
🎯 handleAutoApply called for job: ...
✅ Auto-apply check passed - starting background process
```

**Remove before production** by deleting:
- `React.useEffect` with "Auto-apply Debug Info"
- `console.log` statements in `handleAutoApply`

### Regenerate gRPC Stubs

If you modify `apply_service.proto`:

```bash
cd agent-service
docker run --rm -v "$(pwd):/workspace" -w /workspace python:3.11-slim bash -c \
  "pip install grpcio-tools && python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. apply_service.proto"

# Rebuild container
docker-compose build agent-service
docker-compose up -d agent-service
```

## Production Deployment

### Security

- [ ] Remove debug logging
- [ ] Enable HTTPS/TLS
- [ ] Use production MongoDB (Atlas)
- [ ] Secure JWT secret
- [ ] Enable gRPC TLS
- [ ] Add rate limiting

### Performance

- [ ] Use production build: `expo build:ios/android`
- [ ] Optimize bundle size
- [ ] Add Redis caching
- [ ] Scale agent service (multiple instances)
- [ ] Consider GPU for Ollama (faster inference)

### Monitoring

- [ ] Add application logging (Winston)
- [ ] Monitor API response times
- [ ] Track auto-apply success rates
- [ ] Monitor Ollama memory usage
- [ ] Set up error tracking (Sentry)

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Agent Service**: Python, gRPC, LangChain
- **LLM**: Ollama (llama3.2:3b)
- **Infrastructure**: Docker, Docker Compose

## License

[Your License]

## Contributors

[Your Team]

## Support

- Frontend issues: See `frontend/README.md`
- Backend issues: See `backend/README.md`
- Agent service issues: See `agent-service/README.md`
- Run system test: `./test-system.sh`
