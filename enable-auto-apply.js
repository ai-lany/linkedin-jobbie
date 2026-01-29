#!/usr/bin/env node

/**
 * Script to enable auto-apply for a user and verify all required fields
 *
 * Usage:
 *   node enable-auto-apply.js your-email@example.com
 */

const mongoose = require('mongoose');
require('dotenv').config();
require('./backend/models/User');

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Please provide user email as argument');
  console.error('Usage: node enable-auto-apply.js your-email@example.com');
  process.exit(1);
}

console.log('================================');
console.log('Auto-Apply Configuration Tool');
console.log('================================\n');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✓ Connected to MongoDB\n');

    const User = mongoose.model('User');

    // Find user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.error(`❌ User not found with email: ${userEmail}`);
      console.error('\nAvailable users:');
      const users = await User.find({}, { email: 1, username: 1 }).limit(10);
      users.forEach(u => console.log(`  - ${u.email} (${u.username})`));
      process.exit(1);
    }

    console.log(`Found user: ${user.username} (${user.email})\n`);

    // Check current state
    console.log('Current Configuration:');
    console.log('─────────────────────');
    console.log(`  Email:       ${user.email ? '✓ ' + user.email : '❌ Missing'}`);
    console.log(`  Phone:       ${user.phoneNumber ? '✓ ' + user.phoneNumber : '❌ Missing'}`);
    console.log(`  Resume:      ${user.resume ? '✓ ' + user.resume : '❌ Missing'}`);
    console.log(`  Auto-apply:  ${user.additionalInfo?.autoApply ? '✓ Enabled' : '❌ Disabled'}`);
    console.log('');

    // Check what's missing
    const missing = [];
    if (!user.email) missing.push('email');
    if (!user.phoneNumber) missing.push('phone number');
    if (!user.resume) missing.push('resume');

    if (missing.length > 0) {
      console.log('⚠️  Missing required fields for auto-apply:');
      missing.forEach(field => console.log(`   - ${field}`));
      console.log('\nAdding dummy data for testing purposes...\n');

      if (!user.phoneNumber) {
        user.phoneNumber = '+1234567890';
        console.log('  Added dummy phone: +1234567890');
      }
      if (!user.resume) {
        user.resume = 'uploads/dummy-resume.pdf';
        console.log('  Added dummy resume: uploads/dummy-resume.pdf');
      }
      console.log('\n⚠️  Remember to update with real data before production use!\n');
    }

    // Enable auto-apply
    if (!user.additionalInfo) {
      user.additionalInfo = {};
    }
    user.additionalInfo.autoApply = true;

    await user.save();

    console.log('✅ Auto-apply enabled successfully!\n');

    console.log('Updated Configuration:');
    console.log('─────────────────────');
    console.log(`  Email:       ✓ ${user.email}`);
    console.log(`  Phone:       ✓ ${user.phoneNumber}`);
    console.log(`  Resume:      ✓ ${user.resume}`);
    console.log(`  Auto-apply:  ✓ Enabled`);
    console.log('');

    console.log('================================');
    console.log('Next Steps:');
    console.log('================================');
    console.log('1. Restart your frontend app:');
    console.log('   cd frontend && npm start');
    console.log('');
    console.log('2. Login with this account');
    console.log('');
    console.log('3. Swipe right on a job');
    console.log('   - NO modal should appear');
    console.log('   - Card immediately transitions to next job');
    console.log('');
    console.log('4. Check Applications tab');
    console.log('   - Should show orange "Processing" badge');
    console.log('   - After ~5s, changes to green "Submitted"');
    console.log('================================\n');

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('\nMake sure:');
    console.error('1. MongoDB is running');
    console.error('2. MONGO_URI is set in backend/.env');
    process.exit(1);
  });
