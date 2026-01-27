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

## Data Models

### User
```javascript
{
  username: String,
  email: String,
  phoneNumber: String,
  workHistory: [{
    company: ObjectId (ref: Company),
    title: String,
    startDate: Date,
    endDate: Date,
    current: Boolean
  }]
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

## Notes
- All authenticated routes require a valid JWT token in the Authorization header
- CSRF token is required for state-changing operations (POST, PATCH, DELETE)
- Job applications prevent duplicate submissions (one application per user per job)