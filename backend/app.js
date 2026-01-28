const debug = require('debug');
const express = require("express");
const cookieParser = require('cookie-parser');
const logger = require('morgan');

require('./models/User');
require('./models/Post');
require('./models/Comment');
require('./models/Like');
require('./models/Job');
require('./models/Company');
require('./models/JobApplication');
require('./config/passport');
const passport = require('passport');

const usersRouter = require('./routes/api/users'); // update the import file path
const postsRouter = require('./routes/api/posts');
const commentsRouter = require('./routes/api/comments');
const likesRouter = require('./routes/api/likes');
const jobsRouter = require('./routes/api/jobs');
const companiesRouter = require('./routes/api/companies');
const jobApplicationsRouter = require('./routes/api/jobApplications');
const resumesRouter = require('./routes/api/resumes');

const app = express();

app.use(logger('dev')); // log request components (URL/method) to terminal
app.use(express.json()); // parse JSON request body
app.use(express.urlencoded({ extended: false })); // parse urlencoded request body

app.use(passport.initialize());
const cors = require('cors');
const { isProduction } = require('./config/keys');

// Security Middleware
if (!isProduction) {
    // Enable CORS only in development because React will be on the React
    // development server (http://localhost:3000). (In production, the Express 
    // server will serve the React files statically.) 
    app.use(cors({
        origin: ['http://localhost:8081', 'http://localhost:3000'],
        credentials: true
    }));
}

// Note: CSRF protection removed - not needed for mobile app using JWT authentication
// Mobile apps send JWT tokens in Authorization headers, which aren't vulnerable to CSRF attacks

// Attach Express routers
app.use('/api/users', usersRouter); // update the path
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/likes', likesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/applications', jobApplicationsRouter);
app.use('/api/resumes', resumesRouter);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Express custom middleware for catching all unmatched requests and formatting
// a 404 error to be sent as the response.
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.statusCode = 404;
    next(err);
});
  
const serverErrorLogger = debug('backend:error');
  
// Express custom error handler that will be called whenever a route handler or
// middleware throws an error or invokes the `next` function with a truthy value
app.use((err, req, res, next) => {
    serverErrorLogger(err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode);
    res.json({
      message: err.message,
      statusCode,
      errors: err.errors
    })
});

module.exports = app;
