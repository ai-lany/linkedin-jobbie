const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const passport = require('passport');
const { loginUser, restoreUser } = require('../../config/passport');
const { isProduction } = require('../../config/keys');
const validateRegisterInput = require('../../validations/register');
const validateLoginInput = require('../../validations/login');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({
    message: "GET /api/users"
  });
});

router.post('/register', validateRegisterInput, async (req, res, next) => {
  // Check to make sure no one has already registered with the proposed email or
  // username.
  const user = await User.findOne({
    $or: [{ email: req.body.email }, { username: req.body.username }]
  });

  if (user) {
    // Throw a 400 error if the email address and/or username already exists
    const err = new Error("Validation Error");
    err.statusCode = 400;
    const errors = {};
    if (user.email === req.body.email) {
      errors.email = "A user has already registered with this email";
    }
    if (user.username === req.body.username) {
      errors.username = "A user has already registered with this username";
    }
    err.errors = errors;
    return next(err);
  }

  // Otherwise create a new user
  const newUser = new User({
    username: req.body.username,
    email: req.body.email
  });

  bcrypt.genSalt(10, (err, salt) => {
    if (err) throw err;
    bcrypt.hash(req.body.password, salt, async (err, hashedPassword) => {
      if (err) throw err;
      try {
        newUser.hashedPassword = hashedPassword;
        const user = await newUser.save();
        return res.json(await loginUser(user));
      }
      catch(err) {
        next(err);
      }
    })
  });

});


router.post('/login', validateLoginInput, async (req, res, next) => {
  passport.authenticate('local', async function(err, user) {
    if (err) return next(err);
    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 400;
      err.errors = { email: "Invalid credentials" };
      return next(err);
    }
    return res.json(await loginUser(user));
  })(req, res, next);
});


router.get('/current', restoreUser, (req, res) => {
  if (!isProduction) {
    // In development, allow React server to gain access to the CSRF token
    // whenever the current user information is first loaded into the
    // React application
    // Only set CSRF token if the function is available
    if (typeof req.csrfToken === 'function') {
      const csrfToken = req.csrfToken();
      res.cookie("CSRF-TOKEN", csrfToken);
    }
  }
  if (!req.user) return res.json(null);
  res.json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    phoneNumber: req.user.phoneNumber,
    resume: req.user.resume,
    workHistory: req.user.workHistory,
    additionalInfo: req.user.additionalInfo
  });
});

router.patch('/preferences', restoreUser, async (req, res, next) => {
  try {
    // For demo: if no authenticated user, use first user in database
    let userId = req.user?._id;
    if (!userId) {
      const demoUser = await User.findOne({});
      if (!demoUser) {
        const err = new Error('No users found in database');
        err.statusCode = 404;
        return next(err);
      }
      userId = demoUser._id;
    }

    const allowedFields = [
      'workAuthorizationInCountry',
      'needsVisa',
      'ethnicity',
      'veteran',
      'disability',
      'resumeTailoring',
      'autoApply',
      'gender',
      'willingToRelocate'
    ];

    // Build update object with dot notation for nested additionalInfo fields
    const updateObj = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateObj[`additionalInfo.${key}`] = req.body[key];
      }
    });

    // Update user document
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateObj },
      { new: true, runValidators: true }
    ).select('-hashedPassword');

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    return res.json({
      message: 'Preferences updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        resume: user.resume,
        workHistory: user.workHistory,
        additionalInfo: user.additionalInfo
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
