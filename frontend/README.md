# LinkedIn Job Swipe - Frontend

React Native mobile app for swiping through job opportunities with AI-powered auto-apply functionality.

## Features

- **Job Swiping Interface**: Tinder-style card interface for browsing jobs
- **Background Auto-Apply**: AI processes applications while you continue swiping
- **Real-Time Status Tracking**: See application status (Processing → Submitted → Failed)
- **Easy Apply Modal**: Manual application flow for jobs without auto-apply
- **Applications Dashboard**: Track all your applications with color-coded status badges

## Quick Start

### Prerequisites

- Node.js 16+
- Expo CLI
- iOS Simulator (for macOS) or Android Emulator

### Installation

```bash
npm install
```

### Configuration

Create `.env` file in the frontend directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

For Android emulator, use:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5001/api
```

### Run Development Server

```bash
npm start
```

Then press:
- `w` - Open in web browser
- `i` - Open in iOS simulator
- `a` - Open in Android emulator

## Auto-Apply Feature

### How It Works

When auto-apply is enabled and you swipe right on a job:

1. **No modal appears** - the UI doesn't block
2. **Background processing** - AI agent generates cover letter and answers questions (~15-20s)
3. **Continue swiping** - you can apply to multiple jobs without waiting
4. **Status updates** - Applications tab shows real-time status

### User Requirements

For auto-apply to work, users need:
- ✅ Email address
- ✅ Phone number
- ✅ Resume uploaded
- ✅ Auto-apply enabled in settings

### Status States

Applications show color-coded status badges:

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| **Processing** | 🟠 Orange | Hourglass | AI is generating application materials |
| **Submitted** | 🟢 Green | Dot | Application successfully submitted |
| **Failed** | 🔴 Red | X | Application failed (user can retry) |

### Testing Auto-Apply

1. **Enable auto-apply for test user**:
   ```bash
   # From project root
   node enable-auto-apply.js YOUR_EMAIL@example.com
   ```

2. **Start the app and login**

3. **Open browser console** (F12 or Cmd+Option+I)

4. **Check debug output**:
   ```javascript
   🔍 Auto-apply Debug Info: {
     autoApplyEnabled: true,
     hasEmail: true,
     hasPhone: true,
     hasResume: true,
     hasToken: true,
     canAutoApply: true  // Must be true!
   }
   ```

5. **Swipe right on a job**
   - Should see: "✅ Auto-apply check passed - starting background process"
   - No modal should appear
   - Card immediately transitions to next job

6. **Navigate to Applications tab**
   - Application shows orange "Processing" badge
   - After ~15-20s, changes to green "Submitted"

## Architecture

### Key Components

**Context Providers**:
- `JobContext.tsx` - Manages jobs, swipe history, applications with status tracking
- `AuthContext.tsx` - User authentication and profile

**Main Screens**:
- `app/(tabs)/index.tsx` - Job swiping interface with auto-apply logic
- `app/(tabs)/applications.tsx` - Applications dashboard with status display
- `app/(tabs)/saved.tsx` - Saved jobs
- `app/(tabs)/linkedin-jobs-tab.tsx` - LinkedIn jobs integration

**Components**:
- `SwipeableJobCard.tsx` - Swipeable job card with animations
- `EasyApplyModal.tsx` - Manual application form
- `ApplicationSuccess.tsx` - Success screen after manual apply

### Auto-Apply Flow

```typescript
// In index.tsx
const handleAutoApply = async (job: Job) => {
  // Check if user can auto-apply
  if (!canAutoApply) {
    setApplyingJob(job); // Show modal
    return;
  }

  // Add to applied jobs with pending status
  applyToJob(job, {...}, 'pending');

  try {
    // Call backend API (non-blocking)
    const response = await fetch(`${API_URL}/agent/auto-apply/${job.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    // Update status to completed
    updateApplicationStatus(job.id, 'completed', data.applicationId);
  } catch (err) {
    // Update status to failed
    updateApplicationStatus(job.id, 'failed');
    Alert.alert('Application Failed', `Failed to apply to ${job.title}`);
  }
};
```

### State Management

**JobContext** manages:
- Current jobs and swipe position
- Applied jobs with status tracking
- Saved jobs
- Swipe history for undo functionality

**Application Status Lifecycle**:
```
User swipes right
    ↓
applyToJob(job, data, 'pending')
    ↓
POST /api/agent/auto-apply/:jobId (background)
    ↓
updateApplicationStatus(jobId, 'completed')
```

## Troubleshooting

### Auto-Apply Modal Still Appears

**Check console for `canAutoApply: false`**

If false, check which field is missing:
```javascript
{
  autoApplyEnabled: false,  // Run enable-auto-apply.js
  hasEmail: false,          // User needs email
  hasPhone: false,          // User needs phone
  hasResume: false,         // User needs resume
  hasToken: false           // User needs to login
}
```

**Fix**: Run `node enable-auto-apply.js YOUR_EMAIL` from project root

### Application Stuck in "Processing"

Possible causes:
- Backend not running
- Agent service not responding
- Network error

**Check**:
1. Backend logs: Check terminal running `npm run dev`
2. Network tab in browser DevTools
3. Run system test: `./test-system.sh` from project root

### Changes Not Appearing

**Solution**: Clear Metro bundler cache

```bash
cd frontend
rm -rf .expo
npm start
# Then press 'r' to reload
```

## Project Structure

```
frontend/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Job swiping (auto-apply logic here)
│   │   ├── applications.tsx # Applications dashboard
│   │   ├── saved.tsx        # Saved jobs
│   │   └── linkedin-jobs-tab.tsx
│   └── _layout.tsx          # Root layout with context providers
├── components/              # Reusable components
│   ├── SwipeableJobCard.tsx
│   ├── EasyApplyModal.tsx
│   ├── ApplicationSuccess.tsx
│   └── ...
├── context/                 # React contexts
│   ├── JobContext.tsx       # Jobs, applications, status tracking
│   └── AuthContext.tsx      # Authentication
├── types/                   # TypeScript types
│   └── job.ts
└── constants/              # Theme and constants
    └── theme.ts
```

## API Integration

### Backend Endpoints Used

**Job Operations**:
- `GET /api/jobs` - Fetch available jobs
- `POST /api/applications` - Submit manual application

**Auto-Apply**:
- `POST /api/agent/auto-apply/:jobId` - Background auto-apply endpoint

**Authentication**:
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration

### Request Format

```typescript
// Auto-apply request
POST /api/agent/auto-apply/:jobId
Headers: {
  'Authorization': 'Bearer ${token}'
}

// Response
{
  success: true,
  applicationId: "app-xxx",
  message: "Application submitted successfully"
}
```

## Performance

### Metrics

- **Time to next job**: < 500ms (no blocking)
- **Backend processing**: ~15-20 seconds (background)
- **User can swipe**: 3-4+ more jobs while first processes

### Optimization Tips

1. **Use production build** for better performance:
   ```bash
   expo build:ios
   expo build:android
   ```

2. **Monitor bundle size**:
   ```bash
   npx expo-doctor
   ```

3. **Profile performance**:
   - Open React DevTools
   - Enable "Highlight Updates"
   - Check for unnecessary re-renders

## Development Tips

### Debug Auto-Apply

Debug logs are enabled by default in `index.tsx`:

```typescript
// Shows when component loads
🔍 Auto-apply Debug Info: { ... }

// Shows when user swipes right
🎯 handleAutoApply called for job: ...
✅ Auto-apply check passed - starting background process
```

**Remove debug logs** before production by deleting:
- `React.useEffect` with "Auto-apply Debug Info"
- `console.log` statements in `handleAutoApply`

### Testing Without Backend

Mock the fetch call:

```typescript
// In handleAutoApply
const response = await fetch(...);

// Replace with mock:
const response = {
  ok: true,
  json: async () => ({ success: true, applicationId: 'mock-123' })
};
```

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## Support

For backend/agent service issues, see:
- `backend/README.md`
- `agent-service/README.md`

Run full system test: `./test-system.sh` from project root
