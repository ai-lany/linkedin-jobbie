const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/linkedin_clone_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false }));

async function checkJobs() {
  try {
    const allJobs = await Job.countDocuments({});
    const externalJobs = await Job.countDocuments({ applicationType: 'external' });
    const directJobs = await Job.countDocuments({ applicationType: 'direct' });
    const noTypeJobs = await Job.countDocuments({ applicationType: { $exists: false } });

    console.log('=== Job Application Types ===');
    console.log(`Total jobs: ${allJobs}`);
    console.log(`External jobs: ${externalJobs}`);
    console.log(`Direct jobs: ${directJobs}`);
    console.log(`Jobs without type: ${noTypeJobs}`);
    console.log('');

    // Show first 5 external jobs
    const sampleExternal = await Job.find({ applicationType: 'external' })
      .populate('company', 'name')
      .limit(5)
      .select('_id title company applicationType');

    console.log('Sample external jobs:');
    sampleExternal.forEach(job => {
      const companyName = job.company && job.company.name ? job.company.name : 'Unknown';
      console.log(`  - ${job.title} at ${companyName} (ID: ${job._id})`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkJobs();
