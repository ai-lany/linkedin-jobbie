const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireUser } = require('../../config/passport');
const { generateCoverLetter, answerQuestions, autoApply } = require('../../services/agentClient');

const Job = mongoose.model('Job');

const EXTERNAL_PORTAL_URL = process.env.EXTERNAL_PORTAL_URL || 'http://localhost:3001';

const buildResumeText = (user) => {
  const lines = [
    `Name: ${user.username}`,
    `Email: ${user.email}`,
  ];

  if (user.phoneNumber) {
    lines.push(`Phone: ${user.phoneNumber}`);
  }

  if (user.resume) {
    lines.push(`Resume file: ${user.resume}`);
  }

  if (Array.isArray(user.workHistory) && user.workHistory.length > 0) {
    lines.push('Work history:');
    user.workHistory.forEach((item) => {
      const companyName = item.company?.name || item.company?.toString() || 'Unknown company';
      const roleLine = `${item.title} at ${companyName}`;
      lines.push(`- ${roleLine}`);
    });
  }

  return lines.join('\n');
};

const formatSalary = (salary) => {
  if (!salary || (!salary.min && !salary.max)) {
    return '';
  }
  const currency = salary.currency || 'USD';
  const period = salary.period || '';
  return `${salary.min}-${salary.max} ${currency} ${period}`.trim();
};

const buildExternalApplyUrl = (jobId) => {
  const portalUrl = new URL(EXTERNAL_PORTAL_URL);
  portalUrl.searchParams.set('jobId', jobId);
  return portalUrl.toString();
};


router.post('/cover-letter', requireUser, async (req, res, next) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      const error = new Error('jobId is required');
      error.statusCode = 400;
      return next(error);
    }

    const job = await Job.findById(jobId).populate('company', 'name');
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      return next(error);
    }

    const resumeText = buildResumeText(req.user);
    const requestPayload = {
      job: {
        id: job._id.toString(),
        title: job.title,
        company: job.company?.name || '',
        location: job.location,
        salary: formatSalary(job.salary),
        type: job.jobType || '',
        experience: '',
        description: job.description,
        easy_apply: Array.isArray(job.questions) && job.questions.length > 0,
      },
      profile: {
        name: req.user.username,
        email: req.user.email,
        headline: '',
        summary: '',
        skills: [],
        resume_text: resumeText,
      },
    };

    const response = await generateCoverLetter(requestPayload);
    return res.json({
      coverLetter: response.cover_letter || '',
      message: response.message || 'Cover letter generated',
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/answer-questions', requireUser, async (req, res, next) => {
  try {
    const { jobId, questions } = req.body;

    if (!jobId || !questions || !Array.isArray(questions)) {
      const error = new Error('jobId and questions array are required');
      error.statusCode = 400;
      return next(error);
    }

    const job = await Job.findById(jobId).populate('company', 'name');
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      return next(error);
    }

    const resumeText = buildResumeText(req.user);

    // Format for gRPC (same pattern as cover letter endpoint)
    const requestPayload = {
      job: {
        id: job._id.toString(),
        title: job.title,
        company: job.company?.name || '',
        location: job.location,
        salary: formatSalary(job.salary),
        type: job.jobType || '',
        experience: '',
        description: job.description,
        easy_apply: true,
      },
      profile: {
        name: req.user.username,
        email: req.user.email,
        headline: '',
        summary: '',
        skills: [],
        resume_text: resumeText,
      },
      questions: questions.map(q => ({
        question: q.question || q,
        type: q.type || 'text',
        options: q.options || []
      }))
    };

    const response = await answerQuestions(requestPayload);

    return res.json({
      success: response.success,
      answers: response.answers || [],
      message: response.message || 'Questions answered',
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/auto-apply/:jobId', requireUser, async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Fetch job with company details
    const job = await Job.findById(jobId).populate('company', 'name');
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      return next(error);
    }

    const JobApplication = mongoose.model('JobApplication');
    const existingApplication = await JobApplication.findOne({
      job: job._id,
      applicant: req.user._id,
    });

    const externalApplyUrl = job.applicationType === 'external'
      ? buildExternalApplyUrl(job._id.toString())
      : null;

    if (existingApplication) {
      return res.json({
        success: true,
        applicationId: existingApplication._id.toString(),
        message: 'Application already submitted',
        externalApplyUrl: externalApplyUrl,
        application: {
          coverLetter: existingApplication.coverLetter || '',
          refinedResume: existingApplication.refinedResume || '',
          jobQuestions: Array.isArray(existingApplication.responses)
            ? existingApplication.responses.map((response) => ({
              question: response.question,
              answer: response.answer
            }))
            : [],
          phone: existingApplication.phone || req.user.phoneNumber || '',
          email: existingApplication.email || req.user.email || '',
          preferences: existingApplication.preferences || {
            workAuthorizationInCountry: req.user.additionalInfo?.workAuthorizationInCountry || false,
            needsVisa: req.user.additionalInfo?.needsVisa || false,
            ethnicity: req.user.additionalInfo?.ethnicity || 'Prefer not to say',
            veteran: req.user.additionalInfo?.veteran || 'Prefer not to say',
            disability: req.user.additionalInfo?.disability || 'Prefer not to say',
            gender: req.user.additionalInfo?.gender || 'Prefer not to say',
            willingToRelocate: req.user.additionalInfo?.willingToRelocate || false
          }
        }
      });
    }

    // Build resume text from user profile
    const resumeText = buildResumeText(req.user);

    // Build request payload
    const requestPayload = {
      job: {
        id: job._id.toString(),
        title: job.title,
        company: job.company?.name || '',
        location: job.location,
        salary: formatSalary(job.salary),
        type: job.jobType || '',
        experience: '',
        description: job.description,
        easy_apply: true,
        external_apply_url: externalApplyUrl || '',
      },
      profile: {
        name: req.user.username,
        email: req.user.email,
        headline: '',
        summary: '',
        skills: [],
        resume_text: resumeText,
        resume_url: req.user.resume || '',
      },
      questions: (job.questions || []).map(q => ({
        question: q,
        type: 'text',
        options: []
      }))
    };

    // Call orchestrator agent
    const agentResponse = await autoApply(requestPayload);

    if (!agentResponse.success) {
      const error = new Error('Agent failed to process application');
      error.statusCode = 500;
      return next(error);
    }

    const responses = Array.isArray(agentResponse.answers)
      ? agentResponse.answers.map(a => ({
        question: a.question,
        answer: a.answer
      }))
      : [];

    if (job.applicationType === 'external') {
      return res.json({
        success: true,
        applicationId: '',
        message: 'External application submitted via agent',
        externalApplyUrl: externalApplyUrl,
        application: {
          coverLetter: agentResponse.cover_letter,
          refinedResume: agentResponse.refined_resume,
          jobQuestions: responses,
          phone: req.user.phoneNumber || '',
          email: req.user.email || '',
          preferences: {
            workAuthorizationInCountry: req.user.additionalInfo?.workAuthorizationInCountry || false,
            needsVisa: req.user.additionalInfo?.needsVisa || false,
            ethnicity: req.user.additionalInfo?.ethnicity || 'Prefer not to say',
            veteran: req.user.additionalInfo?.veteran || 'Prefer not to say',
            disability: req.user.additionalInfo?.disability || 'Prefer not to say',
            gender: req.user.additionalInfo?.gender || 'Prefer not to say',
            willingToRelocate: req.user.additionalInfo?.willingToRelocate || false
          }
        }
      });
    }

    // Submit application to database
    const application = new JobApplication({
      job: job._id,
      applicant: req.user._id,
      responses: responses,
      coverLetter: agentResponse.cover_letter,
      resume: req.user.resume,
      refinedResume: agentResponse.refined_resume, // Tailored resume from agent
      phone: req.user.phoneNumber,
      email: req.user.email,
      preferences: {
        workAuthorizationInCountry: req.user.additionalInfo?.workAuthorizationInCountry || false,
        needsVisa: req.user.additionalInfo?.needsVisa || false,
        ethnicity: req.user.additionalInfo?.ethnicity || 'Prefer not to say',
        veteran: req.user.additionalInfo?.veteran || 'Prefer not to say',
        disability: req.user.additionalInfo?.disability || 'Prefer not to say',
        gender: req.user.additionalInfo?.gender || 'Prefer not to say',
        willingToRelocate: req.user.additionalInfo?.willingToRelocate || false
      },
      status: 'pending'
    });

    await application.save();

    return res.json({
      success: true,
      applicationId: application._id.toString(),
      message: 'Application submitted successfully',
      externalApplyUrl: externalApplyUrl,
      application: {
        coverLetter: application.coverLetter,
        refinedResume: application.refinedResume, // Tailored resume from agent
        jobQuestions: responses,
        phone: application.phone,
        email: application.email,
        preferences: application.preferences
      }
    });

  } catch (err) {
    // Handle duplicate application error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }
    return next(err);
  }
});

module.exports = router;
