// const mongoose = require("mongoose");
// const { mongoURI: db } = require('../config/keys.js');
// const User = require('../models/User.js');
// const Tweet = require('../models/Tweet.js');
// const bcrypt = require('bcryptjs');
// const { faker } = require('@faker-js/faker');

// require('dotenv').config();



// const NUM_SEED_USERS = 10;
// const NUM_SEED_TWEETS = 30;

// // Create users
// const users = [];

// users.push(
//   new User ({
//     username: 'demo-user',
//     email: 'demo-user@appacademy.io',
//     hashedPassword: bcrypt.hashSync('starwars', 10)
//   })
// )

// for (let i = 1; i < NUM_SEED_USERS; i++) {
//   const firstName = faker.name.firstName();
//   const lastName = faker.name.lastName();
//   users.push(
//     new User ({
//       username: faker.internet.userName(firstName, lastName),
//       email: faker.internet.email(firstName, lastName),
//       hashedPassword: bcrypt.hashSync(faker.internet.password(), 10)
//     })
//   )
// }
  
// // Create tweets
// const tweets = [];

// for (let i = 0; i < NUM_SEED_TWEETS; i++) {
//   tweets.push(
//     new Tweet ({
//       text: faker.hacker.phrase(),
//       author: users[Math.floor(Math.random() * NUM_SEED_USERS)]._id
//     })
//   )
// }


// mongoose
//   .connect(db, { useNewUrlParser: true })
//   .then(() => {
//     console.log('Connected to MongoDB successfully');
//     insertSeeds();
//   })
//   .catch(err => {
//     console.error(err.stack);
//     process.exit(1);
//   });



//   const insertSeeds = () => {
//     console.log("Resetting db and seeding users and tweets...");
  
//     User.collection.drop()
//                    .then(() => Tweet.collection.drop())
//                    .then(() => User.insertMany(users))
//                    .then(() => Tweet.insertMany(tweets))
//                    .then(() => {
//                      console.log("Done!");
//                      mongoose.disconnect();
//                    })
//                    .catch(err => {
//                      console.error(err.stack);
//                      process.exit(1);
//                    });
//   }




require('dotenv').config();

const mongoose = require("mongoose");
const { mongoURI: db } = require('../config/keys.js');
const User = require('../models/User');
const Post = require('../models/Post');
const Job = require('../models/Job');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Create your seeds (users, posts, and jobs)
const NUM_SEED_USERS = 10;
const NUM_SEED_POSTS = 30;
const NUM_SEED_JOBS = 20;

const users = [];

users.push(
  new User({
    username: 'demo-user',
    email: 'demo-user@appacademy.io',
    hashedPassword: bcrypt.hashSync('starwars', 10)
  })
);

for (let i = 1; i < NUM_SEED_USERS; i++) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  users.push(
    new User({
      username: faker.internet.userName({ firstName, lastName }),
      email: faker.internet.email({ firstName, lastName }),
      hashedPassword: bcrypt.hashSync(faker.internet.password(), 10)
    })
  );
}

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
      company: faker.company.name(),
      title: faker.person.jobTitle(),
      description: faker.lorem.paragraph(),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      jobType: jobTypes[Math.floor(Math.random() * jobTypes.length)],
      questions: jobQuestions,
      postedBy: users[Math.floor(Math.random() * NUM_SEED_USERS)]._id
    })
  );
}

// Connect to the database and insert your seeds
const insertSeeds = () => {
  console.log("Resetting db and seeding users, posts, and jobs...");

  User.collection.drop()
    .then(() => Post.collection.drop())
    .then(() => Job.collection.drop())
    .then(() => User.insertMany(users))
    .then(() => Post.insertMany(posts))
    .then(() => Job.insertMany(jobs))
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
