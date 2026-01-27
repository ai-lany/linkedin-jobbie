require('dotenv').config();

const mongoose = require("mongoose");
const { mongoURI: db } = require('../config/keys.js');
const User = require('../models/User');
const Post = require('../models/Post');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Create your seeds (users, posts, jobs, companies, comments, and likes)
const NUM_SEED_USERS = 10;
const NUM_SEED_POSTS = 30;
const NUM_SEED_COMPANIES = 15;
const NUM_SEED_JOBS = 20;
const NUM_SEED_COMMENTS = 50;
const NUM_SEED_LIKES = 80;

const users = [];

users.push(
  new User({
    username: 'demo-user',
    email: 'demo-user@appacademy.io',
    hashedPassword: bcrypt.hashSync('starwars', 10),
    phoneNumber: faker.phone.number()
  })
);

for (let i = 1; i < NUM_SEED_USERS; i++) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  users.push(
    new User({
      username: faker.internet.userName({ firstName, lastName }),
      email: faker.internet.email({ firstName, lastName }),
      hashedPassword: bcrypt.hashSync(faker.internet.password(), 10),
      phoneNumber: faker.phone.number()
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

for (let i = 0; i < NUM_SEED_JOBS; i++) {
  // Randomly select 0-5 questions
  const numQuestions = Math.floor(Math.random() * 6); // 0 to 5
  const jobQuestions = [];
  const shuffled = [...sampleQuestions].sort(() => 0.5 - Math.random());
  for (let j = 0; j < numQuestions; j++) {
    jobQuestions.push(shuffled[j]);
  }
  
  jobs.push(
    new Job({
      company: companies[Math.floor(Math.random() * NUM_SEED_COMPANIES)]._id,
      title: faker.person.jobTitle(),
      description: faker.lorem.paragraph(),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      jobType: jobTypes[Math.floor(Math.random() * jobTypes.length)],
      questions: jobQuestions,
      postedBy: users[Math.floor(Math.random() * NUM_SEED_USERS)]._id
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

// Connect to the database and insert your seeds
const insertSeeds = () => {
  console.log("Resetting db and seeding users, companies, posts, jobs, comments, and likes...");

  User.collection.drop()
    .then(() => Company.collection.drop())
    .then(() => Post.collection.drop())
    .then(() => Job.collection.drop())
    .then(() => Comment.collection.drop())
    .then(() => Like.collection.drop())
    .then(() => Company.insertMany(companies))
    .then(() => User.insertMany(users))
    .then(() => Post.insertMany(posts))
    .then(() => Job.insertMany(jobs))
    .then(() => Comment.insertMany(comments))
    .then(() => Like.insertMany(likes))
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
