## Getting Started

To start the backend server, do the following:

1. Navigate to the backend directory and run this command to install dependencies:
   ```
   npm install
   ```

2. Navigate to the backend directory and make a new file called .env and paste in the information sent through slack

3. Navigate to the backend directory and run this command to start the backend server:
   ```
   npm run dev
   ```

## API Endpoints

Base URL: `http://localhost:5001/api`

### Authentication
- `GET /api/csrf` - Get CSRF token
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/current` - Get current user (requires auth)

### Users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user profile (requires auth)

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `GET /api/posts/user/:userId` - Get posts by user
- `POST /api/posts` - Create post (requires auth)
- `PATCH /api/posts/:id` - Update post (requires auth, must be author)
- `DELETE /api/posts/:id` - Delete post (requires auth, must be author)

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create comment (requires auth)

### Likes
- `GET /api/likes` - Get all likes
- `GET /api/likes/:id` - Get single like
- `POST /api/likes` - Create like (requires auth)
- `DELETE /api/likes/:id` - Delete like (requires auth, must be owner)

### Jobs
- `GET /api/jobs` - Get all jobs (includes company details)
- `GET /api/jobs/:id` - Get single job with full company info
- `POST /api/jobs` - Create job posting (requires auth)
- `PATCH /api/jobs/:id` - Update job (requires auth, must be poster)
- `DELETE /api/jobs/:id` - Delete job (requires auth, must be poster)

### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get single company
- `POST /api/companies` - Create company (requires auth)
- `PATCH /api/companies/:id` - Update company (requires auth)
- `DELETE /api/companies/:id` - Delete company (requires auth)

### Job Applications
- `GET /api/applications/user/me` - Get your applications (requires auth)
- `GET /api/applications/job/:jobId` - Get applications for a job (requires auth, job poster only)
- `GET /api/applications/:id` - Get single application (requires auth, applicant or job poster)
- `POST /api/applications` - Submit job application (requires auth)
- `PATCH /api/applications/:id/status` - Update application status (requires auth, job poster only)
- `DELETE /api/applications/:id` - Withdraw application (requires auth, only if pending)

### Resume Upload
- `POST /api/resumes/upload` - Upload resume (requires auth, multipart/form-data with 'resume' field)
  - Accepts: PDF, DOC, DOCX
  - Max size: 5MB
  - Returns: `{ message, resumePath, user }`
- `DELETE /api/resumes/delete` - Delete resume (requires auth)
- `GET /uploads/:filename` - Access uploaded resume files

### AI Agent (Auto-Apply)
- `POST /api/agent/cover-letter` - Generate AI cover letter for job (requires auth)
  - Body: `{ jobId: string }`
  - Returns: `{ coverLetter: string, message: string }`
- `POST /api/agent/answer-questions` - AI answers application questions (requires auth)
  - Body: `{ jobId: string, questions: string[] }`
  - Returns: `{ success: boolean, answers: [{ question, answer }], message: string }`
- `POST /api/agent/auto-apply/:jobId` - **Background auto-apply** (requires auth)
  - Orchestrates: Resume tailoring → Cover letter → Question answering
  - Automatically submits application to database
  - Returns: `{ success: boolean, applicationId: string, message: string }`
  - Processing time: ~15-20 seconds (runs in background)

## Data Models

### User
```javascript
{
  username: String,
  email: String,
  phoneNumber: String,
  resume: String, // URL or file path to uploaded resume
  workHistory: [{
    company: ObjectId (ref: Company),
    title: String,
    startDate: Date,
    endDate: Date,
    current: Boolean
  }],
  additionalInfo: {
    workAuthorizationInCountry: Boolean,
    needsVisa: Boolean,
    ethnicity: String,
    veteran: String,
    disability: String,
    resumeTailoring: Boolean,
    autoApply: Boolean,
    gender: String,
    willingToRelocate: Boolean
  }
}
```

### Post
```javascript
{
  author: ObjectId (ref: User),
  text: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Comment
```javascript
{
  user: ObjectId (ref: User),
  post: ObjectId (ref: Post),
  text: String,
  createdAt: Date
}
```

### Like
```javascript
{
  user: ObjectId (ref: User),
  likeable: ObjectId,
  likeableType: 'post' | 'comment',
  createdAt: Date
}
```

### Job
```javascript
{
  company: ObjectId (ref: Company),
  title: String,
  description: String,
  location: String,
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship',
  questions: [String] (max 5),
  postedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Company
```javascript
{
  name: String,
  description: String,
  industry: String,
  location: String,
  website: String,
  size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001-5000' | '5000+',
  createdAt: Date
}
```

### JobApplication
```javascript
{
  job: ObjectId (ref: Job),
  applicant: ObjectId (ref: User),
  responses: [{
    question: String,
    answer: String
  }],
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected',
  coverLetter: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Auto-Apply Architecture

The backend integrates with a Python gRPC Agent Service for AI-powered auto-apply functionality.

### How It Works

```
Frontend swipes right (auto-apply enabled)
    ↓
POST /api/agent/auto-apply/:jobId
    ↓
Backend fetches job from MongoDB
    ↓
Backend calls Agent Service via gRPC (AutoApply RPC)
    ↓
Agent Service runs orchestrator:
  1. Resume tailoring (~4s)
  2. Cover letter generation (~4s)
  3. Question answering (~4s)
    ↓
Backend receives: refined_resume, cover_letter, answers
    ↓
Backend saves JobApplication to MongoDB
    ↓
Returns: { success: true, applicationId: "xxx" }
```

### Agent Service Integration

Located in `services/agentClient.js`:

```javascript
const { autoApply } = require('./services/agentClient');

// Usage in route
const response = await autoApply({
  job: { ... },
  profile: { ... },
  questions: [ ... ]
});
```

**gRPC Connection**:
- Agent Service runs on `localhost:50051`
- Protocol defined in `agent-service/apply_service.proto`
- See `agent-service/README.md` for service details

### Requirements for Auto-Apply

**User must have**:
1. Email address
2. Phone number
3. Resume uploaded
4. `additionalInfo.autoApply` set to `true`

**Enable for a user**:
```bash
# From project root
node enable-auto-apply.js user@example.com
```

### Testing

**Test auto-apply endpoint**:
```bash
# Make sure Agent Service is running
cd agent-service
docker-compose up -d

# Run system test
cd ..
./test-system.sh
```

**Test gRPC connection**:
```bash
# Check if agent service is listening
lsof -i:50051
```

### Error Handling

- **Duplicate application**: Returns 400 with message "You have already applied to this job"
- **Agent service failure**: Returns 500 with error message
- **Missing user data**: Frontend shows manual Easy Apply modal instead
- **Timeout**: Agent service calls timeout after 30 seconds

### Performance

- **API response time**: < 100ms (triggers background work)
- **Agent processing**: ~15-20 seconds total
  - Resume tailoring: ~4s
  - Cover letter: ~4s
  - Question answering: ~4s
- **Non-blocking**: User can continue using app while processing

## Notes
- All authenticated routes require a valid JWT token in the Authorization header
- CSRF token is required for state-changing operations (POST, PATCH, DELETE)
- Job applications prevent duplicate submissions (one application per user per job)
- Agent Service must be running for auto-apply to work (see `agent-service/README.md`)