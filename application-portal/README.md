# Job Application Portal

External job application portal for LinkedIn Jobbie. This is a standalone web application that allows users to apply for jobs marked as "external" in the system.

## Features

- View detailed job information
- Company details and description
- Application form with resume upload
- Dynamic question responses
- Cover letter submission
- Success confirmation page

## Running the Portal

Since this is a static HTML/CSS/JavaScript application, you can serve it using any static file server. Here are a few options:

### Option 1: Python Simple HTTP Server
```bash
cd application-portal
python3 -m http.server 3001
```

Then open: http://localhost:3001?jobId=<JOB_ID>

### Option 2: Node.js http-server
```bash
npm install -g http-server
cd application-portal
http-server -p 3001
```

### Option 3: VS Code Live Server
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Usage

Access the portal with a job ID in the URL:
```
http://localhost:3001?jobId=<JOB_ID>
```

Replace `<JOB_ID>` with an actual job ID from your database that has `applicationType: 'external'`.

## Configuration

The API base URL is configured in `app.js`:
```javascript
const API_BASE_URL = 'http://localhost:5001/api';
```

Update this if your backend is running on a different port.

## File Upload

- Supports PDF, DOC, and DOCX files
- Maximum file size: 5MB
- Files are stored in the backend's `uploads/` directory

## API Endpoints Used

- `GET /api/public/jobs/:jobId` - Fetch job details
- `POST /api/public/applications` - Submit application with resume upload
