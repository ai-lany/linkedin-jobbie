# Auto-Apply Feature Setup Guide

## ✅ What Was Added

### 1. **Frontend UI - Auto-Apply Toggle** (NEW!)
- **File**: `frontend/app/(tabs)/preferences.tsx`
- **Location**: Job Preferences screen (accessible from Profile tab)
- **Features**:
  - ✨ "Enable Auto-Apply" toggle
  - ✨ "AI Resume Tailoring" toggle
  - Description text explaining each feature
  - Saves to user's profile in database

### 2. **Data Flow** (Already Working)
```
User toggles "Enable Auto-Apply" in Preferences
    ↓
Frontend saves to backend: PATCH /api/users/preferences
    ↓
Backend saves to MongoDB: user.additionalInfo.autoApply = true
    ↓
AuthContext updates currentUser with new data
    ↓
Jobs tab checks: currentUser?.additionalInfo?.autoApply
    ↓
When user swipes right:
    - IF autoApply = true AND has email/phone/resume
      → Calls agent service (background processing)
    - ELSE
      → Shows manual apply modal
```

### 3. **Agent Service Integration** (Already Working)
- **Agentic Orchestrator**: Uses LangGraph ReAct agent
- **Tools Available**:
  - `tailor_resume` - AI resume customization
  - `generate_cover_letter` - AI cover letter generation
  - `answer_application_questions` - AI answers to job questions
- **Endpoint**: `POST /api/agent/auto-apply/:jobId`
- **Returns**: coverLetter, refinedResume, jobQuestions, phone, email

### 4. **UI Display** (Already Working)
- **Applications Tab**: Shows all submitted applications
- **Application Review Modal**: Shows full details:
  - ✨ AI-Tailored Resume (with sparkles icon)
  - Cover Letter
  - Answered Questions
  - Contact Info
  - Preferences

## 🚀 How to Use

### For Users:

1. **Navigate to Profile Tab**
2. **Tap "Job Preferences"**
3. **Scroll to "AI-Powered Features" section**
4. **Toggle "Enable Auto-Apply" ON**
5. **Tap "Save Preferences"**
6. **Go to Jobs Tab and swipe right on a job**
   - Application will process in background
   - See status in Applications tab

### Prerequisites:
- ✅ Email address
- ✅ Phone number
- ✅ Resume uploaded

## 🧪 Testing

### Quick Test:
```bash
cd /Users/agaguila/Documents/HackWeek/linkedin-jobbie

# 1. Check services
./quick-check.sh

# 2. Test with auth token
./test-auto-apply-flow.sh
```

### Manual UI Test:
1. Log in to the app
2. Go to Profile → Job Preferences
3. Enable "Auto-Apply"
4. Save
5. Go to Jobs tab
6. Swipe right on a job
7. Check Applications tab - should show "Processing" then "Submitted"
8. Tap the application to see AI-generated content

### Watch Agent Logs:
```bash
docker logs agent-service -f
```

Then swipe right in the UI. You should see:
```
[AUTO_APPLY] Received request for job: ...
[AGENTIC_ORCHESTRATOR] Starting agentic application processing...
[AGENT TRACE] ===== Agent Execution Trace =====
[RESUME_TOOL] Tailoring resume for: ...
[COVER_LETTER_TOOL] Generating cover letter for: ...
[QUESTIONS_TOOL] Answering 3 questions...
```

## 📋 Checklist

- [x] Frontend UI toggle added
- [x] Backend saves autoApply preference
- [x] Jobs tab checks autoApply setting
- [x] Agent service orchestrator working
- [x] Agent tools (resume, cover letter, questions) working
- [x] Backend endpoint `/agent/auto-apply/:jobId` working
- [x] Database saves refined resume
- [x] Applications tab displays AI content
- [x] Application review modal shows all fields

## 🔧 Troubleshooting

### Auto-apply not triggering?
- Check: Is toggle enabled in Preferences?
- Check: Does user have email, phone, and resume?
- Check browser console for: `canAutoApply: true`

### No agent logs?
- Check: `docker ps` - is agent-service running?
- Check: Backend calling agent? Look for API errors in browser Network tab
- Run: `./test-endpoint-only.sh` to verify route exists

### Application not showing content?
- Check: Backend response includes `refinedResume`, `coverLetter`, `jobQuestions`
- Check: Frontend updated from backend response
- Look in Applications tab - tap on application to see modal

## 🎯 Key Files Modified

### Frontend:
- `frontend/app/(tabs)/preferences.tsx` - Added AI Features section with toggles
- `frontend/types/job.ts` - Added refinedResume field
- `frontend/components/ApplicationReviewModal.tsx` - Display AI-tailored resume

### Backend:
- `backend/routes/api/agent.js` - Returns refinedResume in response
- `backend/models/JobApplication.js` - Added refinedResume field

### Agent Service:
- `agent-service/chains/agentic_orchestrator.py` - ReAct agent with tool selection
- `agent-service/chains/resume_tool.py` - Resume tailoring as @tool
- `agent-service/chains/cover_letter_tool.py` - Cover letter as @tool
- `agent-service/chains/question_answering_tool.py` - Questions as @tool
- `agent-service/agent_server.py` - AutoApply RPC handler

## 🌟 Features

### Fully Agentic
- ✅ Dynamic tool selection
- ✅ Reasoning traces
- ✅ Context chaining (uses resume in cover letter)
- ✅ Conditional logic (only answers questions if present)

### Non-Blocking UX
- ✅ User continues swiping immediately
- ✅ Background processing
- ✅ Status tracking (pending → completed/failed)
- ✅ Toast notifications

### Intelligent Content
- ✅ Resume tailored to job description
- ✅ Professional cover letter
- ✅ Contextual question answers
- ✅ Uses user's work history
