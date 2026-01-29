const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const { restoreUser } = require('../../config/passport');

// Get all work history for current user
router.get('/', restoreUser, async (req, res, next) => {
  try {
    // For demo: if no user is authenticated, get the first user
    let userId = req.user?._id;
    if (!userId) {
      const demoUser = await User.findOne({});
      if (!demoUser) {
        return res.json({ workHistory: [] });
      }
      userId = demoUser._id;
    }

    const user = await User.findById(userId)
      .populate('workHistory.company', 'name')
      .select('workHistory');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }

    return res.json({
      workHistory: user.workHistory || []
    });
  } catch (err) {
    next(err);
  }
});

// Add new work history entry
router.post('/', restoreUser, async (req, res, next) => {
  try {
    const { companyName, title, startDate, endDate, current } = req.body;

    // Validation
    if (!companyName || !title || !startDate) {
      const error = new Error('Company name, title, and start date are required');
      error.statusCode = 400;
      return next(error);
    }

    // For demo: if no user is authenticated, get the first user
    let userId = req.user?._id;
    if (!userId) {
      const demoUser = await User.findOne({});
      if (!demoUser) {
        const error = new Error('No users found in database');
        error.statusCode = 404;
        return next(error);
      }
      userId = demoUser._id;
    }

    // Find or create company
    const Company = mongoose.model('Company');
    let company = await Company.findOne({ name: companyName });

    if (!company) {
      company = new Company({
        name: companyName,
        description: 'No description provided',
        industry: 'Not specified',
        location: 'Not specified'
      });
      await company.save();
    }

    // Create work history entry
    const workHistoryEntry = {
      company: company._id,
      title: title,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      current: current || false
    };

    // Add to user's work history
    const user = await User.findById(userId);
    user.workHistory.push(workHistoryEntry);
    await user.save();

    // Populate and return
    const updatedUser = await User.findById(userId)
      .populate('workHistory.company', 'name')
      .select('workHistory');

    return res.json({
      message: 'Work history added successfully',
      workHistory: updatedUser.workHistory
    });
  } catch (err) {
    next(err);
  }
});

// Update work history entry
router.patch('/:id', restoreUser, async (req, res, next) => {
  try {
    const { companyName, title, startDate, endDate, current } = req.body;
    const workHistoryId = req.params.id;

    // For demo: if no user is authenticated, get the first user
    let userId = req.user?._id;
    if (!userId) {
      const demoUser = await User.findOne({});
      if (!demoUser) {
        const error = new Error('No users found in database');
        error.statusCode = 404;
        return next(error);
      }
      userId = demoUser._id;
    }

    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }

    // Find work history entry
    const workHistoryEntry = user.workHistory.id(workHistoryId);

    if (!workHistoryEntry) {
      const error = new Error('Work history entry not found');
      error.statusCode = 404;
      return next(error);
    }

    // Update company if changed
    if (companyName) {
      const Company = mongoose.model('Company');
      let company = await Company.findOne({ name: companyName });

      if (!company) {
        company = new Company({
          name: companyName,
          description: 'No description provided',
          industry: 'Not specified',
          location: 'Not specified'
        });
        await company.save();
      }

      workHistoryEntry.company = company._id;
    }

    // Update other fields
    if (title) workHistoryEntry.title = title;
    if (startDate) workHistoryEntry.startDate = new Date(startDate);
    if (endDate !== undefined) {
      workHistoryEntry.endDate = endDate ? new Date(endDate) : null;
    }
    if (current !== undefined) workHistoryEntry.current = current;

    await user.save();

    // Populate and return
    const updatedUser = await User.findById(user._id)
      .populate('workHistory.company', 'name')
      .select('workHistory');

    return res.json({
      message: 'Work history updated successfully',
      workHistory: updatedUser.workHistory
    });
  } catch (err) {
    next(err);
  }
});

// Delete work history entry
router.delete('/:id', restoreUser, async (req, res, next) => {
  try {
    const workHistoryId = req.params.id;

    // For demo: if no user is authenticated, get the first user
    let userId = req.user?._id;
    if (!userId) {
      const demoUser = await User.findOne({});
      if (!demoUser) {
        const error = new Error('No users found in database');
        error.statusCode = 404;
        return next(error);
      }
      userId = demoUser._id;
    }

    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }

    // Find and remove work history entry
    const workHistoryEntry = user.workHistory.id(workHistoryId);

    if (!workHistoryEntry) {
      const error = new Error('Work history entry not found');
      error.statusCode = 404;
      return next(error);
    }

    workHistoryEntry.deleteOne();
    await user.save();

    return res.json({
      message: 'Work history deleted successfully',
      workHistory: user.workHistory
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
