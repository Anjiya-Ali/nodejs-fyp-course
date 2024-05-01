const { body, validationResult } = require('express-validator');

const validateSkills = [
  body('skills_required')
    .isArray({ min: 1 })
    .withMessage('At least one skill is required in the skills array')
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('Skills must be an array');
      }
      if (value.length < 1) {
        throw new Error('At least one skill is required in the skills array');
      }
      for (const skill of value) {
        if (typeof skill !== 'string' || skill.length < 2) {
          throw new Error('Each skill must be a string with at least 2 characters');
        }
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = validateSkills;