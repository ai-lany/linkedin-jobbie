const { check } = require("express-validator");
const handleValidationErrors = require('./handleValidationErrors');

const validateJobInput = [
  check('company')
    .exists({ checkFalsy: true })
    .withMessage("Company name is required"),
  check('title')
    .exists({ checkFalsy: true })
    .withMessage("Job title is required"),
  check('description')
    .exists({ checkFalsy: true })
    .withMessage("Job description is required"),
  check('location')
    .exists({ checkFalsy: true })
    .withMessage("Location is required"),
  handleValidationErrors
];

module.exports = validateJobInput;
