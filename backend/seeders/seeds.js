require('dotenv').config();

const mongoose = require("mongoose");
const { mongoURI: db } = require('../config/keys.js');
const User = require('../models/User');
const Post = require('../models/Post');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const JobApplication = require('../models/JobApplication');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Create your seeds (users, posts, jobs, companies, comments, likes, and applications)
const NUM_SEED_USERS = 10;
const NUM_SEED_POSTS = 30;
const NUM_SEED_COMPANIES = 15;
const NUM_SEED_JOBS = 50;
const NUM_SEED_COMMENTS = 50;
const NUM_SEED_LIKES = 80;
const NUM_SEED_APPLICATIONS = 40;

const users = [];

users.push(
  new User({
    username: 'testuser1',
    email: 'testuser1@gmail.com',
    hashedPassword: bcrypt.hashSync('password', 10),
    phoneNumber: faker.phone.number(),
    resume: '/uploads/demo-user-resume.pdf',
    additionalInfo: {
      workAuthorizationInCountry: true,
      needsVisa: false,
      ethnicity: 'Prefer not to say',
      veteran: 'Not a veteran',
      disability: 'No',
      resumeTailoring: true,
      autoApply: false,
      gender: 'Prefer not to say',
      willingToRelocate: true
    }
  })
);

const ethnicities = ['Asian', 'Black or African American', 'Hispanic or Latino', 'White', 'Native American', 'Pacific Islander', 'Two or more races', 'Prefer not to say'];
const veteranStatuses = ['Not a veteran', 'Veteran', 'Active duty', 'Prefer not to say'];
const disabilityStatuses = ['Yes', 'No', 'Prefer not to say'];
const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

for (let i = 1; i < NUM_SEED_USERS; i++) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const userId = faker.string.uuid();
  
  users.push(
    new User({
      username: faker.internet.userName({ firstName, lastName }),
      email: faker.internet.email({ firstName, lastName }),
      hashedPassword: bcrypt.hashSync(faker.internet.password(), 10),
      phoneNumber: faker.phone.number(),
      resume: Math.random() > 0.3 ? `/uploads/${userId}-resume.pdf` : undefined,
      additionalInfo: {
        workAuthorizationInCountry: Math.random() > 0.3,
        needsVisa: Math.random() > 0.7,
        ethnicity: ethnicities[Math.floor(Math.random() * ethnicities.length)],
        veteran: veteranStatuses[Math.floor(Math.random() * veteranStatuses.length)],
        disability: disabilityStatuses[Math.floor(Math.random() * disabilityStatuses.length)],
        resumeTailoring: Math.random() > 0.5,
        autoApply: Math.random() > 0.6,
        gender: genders[Math.floor(Math.random() * genders.length)],
        willingToRelocate: Math.random() > 0.4
      }
    })
  );
}

// Create companies first
const companies = [];
const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Consulting'];
const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];

for (let i = 0; i < NUM_SEED_COMPANIES; i++) {
  companies.push(
    new Company({
      name: faker.company.name(),
      description: faker.company.catchPhrase() + '. ' + faker.lorem.paragraph(),
      industry: industries[Math.floor(Math.random() * industries.length)],
      location: `${faker.location.city()}, ${faker.location.state()}`,
      website: faker.internet.url(),
      size: companySizes[Math.floor(Math.random() * companySizes.length)]
    })
  );
}

// Add work history to users
users.forEach(user => {
  const numJobs = Math.floor(Math.random() * 4); // 0-3 previous jobs
  const workHistory = [];
  
  for (let i = 0; i < numJobs; i++) {
    const startDate = faker.date.past({ years: 5 });
    const isCurrent = i === 0 && Math.random() > 0.5;
    
    workHistory.push({
      company: companies[Math.floor(Math.random() * NUM_SEED_COMPANIES)]._id,
      title: faker.person.jobTitle(),
      startDate: startDate,
      endDate: isCurrent ? null : faker.date.between({ from: startDate, to: new Date() }),
      current: isCurrent
    });
  }
  
  user.workHistory = workHistory;
});

const posts = [];

for (let i = 0; i < NUM_SEED_POSTS; i++) {
  posts.push(
    new Post({
      text: faker.hacker.phrase(),
      author: users[Math.floor(Math.random() * NUM_SEED_USERS)]._id
    })
  );
}

const jobs = [];
const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const sampleQuestions = [
  "Why do you want to work for our company?",
  "What are your salary expectations?",
  "Describe a challenging project you've worked on.",
  "What are your greatest strengths?",
  "Where do you see yourself in 5 years?",
  "Tell us about a time you worked in a team.",
  "How do you handle tight deadlines?",
  "What motivates you in your work?"
];

// Function to generate realistic job descriptions
const generateJobDescription = (title, companyName, jobType, industry) => {
  // Varied responsibilities based on job domain
  const techResponsibilities = [
    'Design, develop, and maintain scalable software applications',
    'Write clean, maintainable code following best practices and design patterns',
    'Participate in architecture discussions and technical design reviews',
    'Debug and resolve complex technical issues in production environments',
    'Implement automated testing and CI/CD pipelines',
    'Optimize application performance and database queries',
    'Contribute to technical documentation and knowledge sharing',
    'Conduct code reviews and provide constructive feedback to peers'
  ];

  const designResponsibilities = [
    'Create user-centered designs through research and iterative feedback',
    'Develop wireframes, prototypes, and high-fidelity mockups',
    'Establish and maintain design systems and component libraries',
    'Conduct usability testing and incorporate findings into designs',
    'Collaborate with product managers to define user requirements',
    'Present design concepts to stakeholders and incorporate feedback',
    'Stay current with design trends and emerging tools',
    'Work closely with developers to ensure accurate implementation'
  ];

  const businessResponsibilities = [
    'Develop and execute strategic initiatives to drive business growth',
    'Analyze market trends and competitive landscape',
    'Build and maintain relationships with key stakeholders',
    'Create detailed reports and presentations for leadership',
    'Identify opportunities for process improvement and efficiency',
    'Manage project timelines and coordinate cross-functional teams',
    'Monitor key performance indicators and drive data-driven decisions',
    'Contribute to quarterly planning and annual budgeting processes'
  ];

  const marketingResponsibilities = [
    'Develop and execute multi-channel marketing campaigns',
    'Create compelling content for various platforms and audiences',
    'Analyze campaign performance metrics and optimize strategies',
    'Manage social media presence and community engagement',
    'Collaborate with sales team to generate qualified leads',
    'Conduct market research to identify customer needs and preferences',
    'Coordinate with creative team on brand messaging and assets',
    'Track and report on marketing ROI and conversion rates'
  ];

  // Varied requirements based on experience level and domain
  const seniorRequirements = [
    '7+ years of relevant professional experience',
    'Proven track record of leading complex projects to successful completion',
    'Strong leadership and mentorship capabilities',
    'Excellent strategic thinking and problem-solving skills',
    'Experience managing stakeholder expectations and relationships',
    'Advanced knowledge of industry best practices and trends'
  ];

  const midRequirements = [
    '3-5 years of relevant professional experience',
    'Strong foundation in core concepts and methodologies',
    'Demonstrated ability to work independently and in teams',
    'Good communication skills with technical and non-technical audiences',
    'Experience with agile development methodologies',
    'Proven ability to deliver projects on time and within scope'
  ];

  const juniorRequirements = [
    '1-2 years of relevant experience or equivalent education',
    'Strong foundational knowledge and eagerness to learn',
    'Good problem-solving and analytical skills',
    'Ability to work effectively in a collaborative team environment',
    'Strong attention to detail and commitment to quality',
    'Excellent communication and interpersonal skills'
  ];

  const internRequirements = [
    'Currently pursuing or recently completed relevant degree',
    'Strong academic performance and demonstrated interest in the field',
    'Quick learner with ability to adapt to new technologies',
    'Excellent teamwork and collaboration skills',
    'Strong work ethic and enthusiasm for professional growth',
    'Good written and verbal communication abilities'
  ];

  // Technical skills based on role type
  const techSkills = [
    'Experience with modern programming languages (Java, Python, JavaScript, etc.)',
    'Knowledge of cloud platforms (AWS, Azure, GCP)',
    'Familiarity with containerization and orchestration tools',
    'Understanding of RESTful APIs and microservices architecture',
    'Experience with version control systems (Git)',
    'Knowledge of database design and SQL/NoSQL technologies'
  ];

  const designSkills = [
    'Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)',
    'Strong understanding of design principles and color theory',
    'Experience creating responsive and accessible designs',
    'Knowledge of HTML/CSS fundamentals',
    'Familiarity with design thinking methodologies',
    'Understanding of user research and testing techniques'
  ];

  const businessSkills = [
    'Advanced Excel and data analysis capabilities',
    'Experience with CRM and project management tools',
    'Strong financial acumen and business modeling skills',
    'Excellent presentation and stakeholder management abilities',
    'Knowledge of industry regulations and compliance requirements',
    'Proficiency in business intelligence tools (Tableau, Power BI)'
  ];

  // Determine job domain from title
  const titleLower = title.toLowerCase();
  let responsibilities, technicalSkills, experienceLevel;

  if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('architect')) {
    responsibilities = techResponsibilities;
    technicalSkills = techSkills;
  } else if (titleLower.includes('design') || titleLower.includes('ux') || titleLower.includes('ui')) {
    responsibilities = designResponsibilities;
    technicalSkills = designSkills;
  } else if (titleLower.includes('market') || titleLower.includes('brand') || titleLower.includes('content')) {
    responsibilities = marketingResponsibilities;
    technicalSkills = businessSkills;
  } else {
    responsibilities = businessResponsibilities;
    technicalSkills = businessSkills;
  }

  // Determine experience level
  if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal') || titleLower.includes('director')) {
    experienceLevel = seniorRequirements;
  } else if (titleLower.includes('junior') || titleLower.includes('entry') || titleLower.includes('associate')) {
    experienceLevel = juniorRequirements;
  } else if (jobType === 'Internship') {
    experienceLevel = internRequirements;
  } else {
    experienceLevel = midRequirements;
  }

  // Build description with variety
  const numResponsibilities = 4 + Math.floor(Math.random() * 3);
  const numRequirements = 3 + Math.floor(Math.random() * 2);
  const numSkills = 3 + Math.floor(Math.random() * 3);

  const selectedResponsibilities = [...responsibilities]
    .sort(() => 0.5 - Math.random())
    .slice(0, numResponsibilities);
  
  const selectedRequirements = [...experienceLevel]
    .sort(() => 0.5 - Math.random())
    .slice(0, numRequirements);
  
  const selectedSkills = [...technicalSkills]
    .sort(() => 0.5 - Math.random())
    .slice(0, numSkills);

  const intro = `${companyName} is ${industry === 'Technology' ? 'a leading technology company' : industry === 'Healthcare' ? 'a healthcare organization' : industry === 'Finance' ? 'a financial services firm' : `an established ${industry.toLowerCase()} company`} seeking a talented ${title} to join our team. This ${jobType.toLowerCase()} role offers a unique opportunity to make an impact in a ${jobType === 'Internship' ? 'fast-paced learning environment' : 'dynamic and growing organization'}.`;
  
  const aboutRole = `\n\nAbout the Role:\nAs our ${title}, you will play a key role in ${jobType === 'Internship' ? 'supporting our team and gaining hands-on experience' : 'driving initiatives that directly impact our success'}. ${jobType === 'Contract' ? 'This contract position has an initial duration of 6-12 months with potential for extension.' : jobType === 'Part-time' ? 'This part-time role offers 20-30 hours per week with flexible scheduling.' : 'You will work closely with talented professionals and have opportunities for career growth.'}`;
  
  const responsibilitiesText = `\n\nKey Responsibilities:\n• ${selectedResponsibilities.join('\n• ')}`;
  
  const requirementsText = `\n\nQualifications:\n• ${selectedRequirements.join('\n• ')}\n• ${selectedSkills.join('\n• ')}`;
  
  const benefits = `\n\nWhat We Offer:\n• Competitive ${jobType === 'Internship' ? 'stipend and learning opportunities' : 'compensation and benefits package'}\n• ${jobType === 'Full-time' ? 'Comprehensive health, dental, and vision insurance' : 'Flexible work arrangements'}\n• Professional development and training opportunities\n• ${industry === 'Technology' ? 'Cutting-edge technology stack and modern tools' : 'Collaborative and supportive work environment'}\n• ${jobType === 'Full-time' ? 'Generous PTO and work-life balance initiatives' : 'Opportunity to work with industry experts'}`;
  
  return intro + aboutRole + responsibilitiesText + requirementsText + benefits;
};

for (let i = 0; i < NUM_SEED_JOBS; i++) {
  // Randomly select 0-5 questions
  const numQuestions = Math.floor(Math.random() * 6); // 0 to 5
  const jobQuestions = [];
  const shuffled = [...sampleQuestions].sort(() => 0.5 - Math.random());
  for (let j = 0; j < numQuestions; j++) {
    jobQuestions.push(shuffled[j]);
  }
  
  const company = companies[Math.floor(Math.random() * NUM_SEED_COMPANIES)];
  const title = faker.person.jobTitle();
  const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
  
  // 30% of jobs are external (redirect to application portal)
  const applicationType = Math.random() < 0.3 ? 'external' : 'direct';
  
  jobs.push(
    new Job({
      company: company._id,
      title: title,
      description: generateJobDescription(title, company.name, jobType, company.industry),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      jobType: jobType,
      questions: jobQuestions,
      postedBy: users[Math.floor(Math.random() * NUM_SEED_USERS)]._id,
      applicationType: applicationType
    })
  );
}

// Create comments on posts
const comments = [];

for (let i = 0; i < NUM_SEED_COMMENTS; i++) {
  comments.push(
    new Comment({
      user: users[Math.floor(Math.random() * NUM_SEED_USERS)]._id,
      post: posts[Math.floor(Math.random() * NUM_SEED_POSTS)]._id,
      text: faker.lorem.sentence()
    })
  );
}

// Create likes on posts and comments
const likes = [];

for (let i = 0; i < NUM_SEED_LIKES; i++) {
  // Randomly choose to like either a post or a comment
  const likePost = Math.random() > 0.5;
  
  likes.push(
    new Like({
      user: users[Math.floor(Math.random() * NUM_SEED_USERS)]._id,
      likeable: likePost 
        ? posts[Math.floor(Math.random() * NUM_SEED_POSTS)]._id
        : comments[Math.floor(Math.random() * NUM_SEED_COMMENTS)]._id,
      likeableType: likePost ? 'post' : 'comment'
    })
  );
}

// Create job applications
const applications = [];
const statuses = ['pending', 'reviewing', 'accepted', 'rejected'];
const appliedJobs = new Set(); // Track user-job combinations to avoid duplicates

for (let i = 0; i < NUM_SEED_APPLICATIONS; i++) {
  let userId, jobId, key;
  let attempts = 0;
  
  // Find a unique user-job combination
  do {
    userId = Math.floor(Math.random() * NUM_SEED_USERS);
    jobId = Math.floor(Math.random() * NUM_SEED_JOBS);
    key = `${userId}-${jobId}`;
    attempts++;
  } while (appliedJobs.has(key) && attempts < 100);
  
  if (attempts >= 100) break; // Prevent infinite loop
  
  appliedJobs.add(key);
  
  // Get the job's questions to create responses
  const job = jobs[jobId];
  const responses = job.questions.map(question => ({
    question: question,
    answer: faker.lorem.sentences(2)
  }));
  
  applications.push(
    new JobApplication({
      job: job._id,
      applicant: users[userId]._id,
      responses: responses,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      coverLetter: Math.random() > 0.3 ? faker.lorem.paragraphs(2) : undefined
    })
  );
}

// Connect to the database and insert your seeds
const insertSeeds = () => {
  console.log("Resetting db and seeding users, companies, posts, jobs, comments, likes, and applications...");

  User.collection.drop()
    .then(() => Company.collection.drop())
    .then(() => Post.collection.drop())
    .then(() => Job.collection.drop())
    .then(() => Comment.collection.drop())
    .then(() => Like.collection.drop())
    .then(() => JobApplication.collection.drop())
    .then(() => Company.insertMany(companies))
    .then(() => User.insertMany(users))
    .then(() => Post.insertMany(posts))
    .then(() => Job.insertMany(jobs))
    .then(() => Comment.insertMany(comments))
    .then(() => Like.insertMany(likes))
    .then(() => JobApplication.insertMany(applications))
    .then(() => {
      console.log("Done!");
      mongoose.disconnect();
    })
    .catch(err => {
      console.error(err.stack);
      process.exit(1);
    });
};

// Connect to the database
mongoose
  .connect(db)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    insertSeeds();
  })
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
