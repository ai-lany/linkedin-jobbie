const API_BASE_URL = 'http://localhost:5001/api';

// Get job ID from URL query parameter
function getJobIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('jobId');
}

// Fetch job details
async function fetchJobDetails(jobId) {
    try {
        const response = await fetch(`${API_BASE_URL}/public/jobs/${jobId}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch job details');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Display job details on the page
function displayJobDetails(job) {
    document.getElementById('job-title').textContent = job.title;
    document.getElementById('company-name').textContent = job.company.name;
    document.getElementById('company-location').textContent = job.company.location;
    document.getElementById('job-location').textContent = job.location;
    document.getElementById('job-type').textContent = job.jobType;
    document.getElementById('job-description').textContent = job.description;
    document.getElementById('company-description').textContent = job.company.description;
    document.getElementById('company-industry').textContent = job.company.industry;
    document.getElementById('company-size').textContent = job.company.size;
    
    if (job.company.website) {
        document.getElementById('company-website').href = job.company.website;
        document.getElementById('company-website').textContent = job.company.website;
    } else {
        document.getElementById('company-website-container').style.display = 'none';
    }

    // Display questions if any
    if (job.questions && job.questions.length > 0) {
        const questionsContainer = document.getElementById('questions-container');
        questionsContainer.innerHTML = '<h4 style="margin-bottom: 16px; font-size: 18px;">Additional Questions</h4>';
        
        job.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-group';
            questionDiv.innerHTML = `
                <label for="question-${index}">${question}</label>
                <textarea id="question-${index}" name="question-${index}" rows="4" required></textarea>
            `;
            questionsContainer.appendChild(questionDiv);
        });
    }

    // Show job details and hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('job-details').style.display = 'block';
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

// Show success message
function showSuccess() {
    document.getElementById('job-details').style.display = 'none';
    document.getElementById('success').style.display = 'block';
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    const jobId = getJobIdFromUrl();
    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('jobId', jobId);
        formData.append('fullName', form.fullName.value);
        formData.append('email', form.email.value);
        formData.append('phone', form.phone.value);
        formData.append('coverLetter', form.coverLetter.value);
        
        // Add resume file
        const resumeFile = form.resume.files[0];
        if (resumeFile) {
            // Check file size (5MB)
            if (resumeFile.size > 5 * 1024 * 1024) {
                throw new Error('Resume file size must be less than 5MB');
            }
            formData.append('resume', resumeFile);
        }
        
        // Collect answers to questions
        const responses = [];
        const questionInputs = document.querySelectorAll('[id^="question-"]');
        questionInputs.forEach((input) => {
            const questionLabel = document.querySelector(`label[for="${input.id}"]`);
            responses.push({
                question: questionLabel.textContent,
                answer: input.value
            });
        });
        
        if (responses.length > 0) {
            formData.append('responses', JSON.stringify(responses));
        }
        
        // Submit application
        const response = await fetch(`${API_BASE_URL}/public/applications`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit application');
        }
        
        // Show success message
        showSuccess();
        
    } catch (error) {
        alert('Error: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
    }
}

// Initialize the page
async function init() {
    const jobId = getJobIdFromUrl();
    
    if (!jobId) {
        showError('No job ID provided in URL');
        return;
    }
    
    try {
        const job = await fetchJobDetails(jobId);
        displayJobDetails(job);
        
        // Attach form submit handler
        document.getElementById('application-form').addEventListener('submit', handleSubmit);
    } catch (error) {
        showError(error.message);
    }
}

// Run init when page loads
document.addEventListener('DOMContentLoaded', init);
