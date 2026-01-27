const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Company = mongoose.model('Company');
const { requireUser } = require('../../config/passport');

// Get all companies
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find()
                                   .sort({ name: 1 });

    let companiesObject = {}
    companies.forEach((company) => {
      companiesObject[company._id] = company;
    })

    return res.json(companiesObject);
  }
  catch(err) {
    return res.json([]);
  }
});

// Get single company by ID
router.get('/:id', async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    return res.json(company);
  }
  catch(err) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    error.errors = { message: "No company found with that id" };
    return next(error);
  }
});

// Create a new company (requires authentication)
router.post('/', requireUser, async (req, res, next) => {
  try {
    const newCompany = new Company({
      name: req.body.name,
      description: req.body.description,
      industry: req.body.industry,
      location: req.body.location,
      website: req.body.website,
      size: req.body.size
    });

    let company = await newCompany.save();
    return res.json(company);
  }
  catch(err) {
    next(err);
  }
});

// Update a company (requires authentication)
router.patch('/:id', requireUser, async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          description: req.body.description,
          industry: req.body.industry,
          location: req.body.location,
          website: req.body.website,
          size: req.body.size
        }
      },
      {new: true}
    );

    if (!company){
      const error = new Error('Company not found');
      error.statusCode = 404;
      error.errors = { message: 'No company found with that id'};
      return next(error);
    }

    return res.json(company)
  } catch (err) {
    next(err);
  }
});

// Delete a company (requires authentication)
router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company){
      const error = new Error('Company not found')
      error.statusCode = 404;
      error.errors = { message: 'No company found with that id' };
      return next(error);
    }
    return res.json({ message: 'Company deleted successfully' });
  } catch(err) {
    next(err);
  }
})

module.exports = router;
