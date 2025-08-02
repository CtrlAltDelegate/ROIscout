const Joi = require('joi');

// Validation schemas
const schemas = {
  signup: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must be less than 128 characters',
        'any.required': 'Password is required',
      }),
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),

  saveSearch: Joi.object({
    searchName: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Search name cannot be empty',
        'string.max': 'Search name must be less than 100 characters',
        'any.required': 'Search name is required',
      }),
    filters: Joi.object({
      state: Joi.string().length(2).required(),
      county: Joi.string().allow(''),
      zipCode: Joi.string().allow(''),
      minPrice: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().allow('')
      ),
      maxPrice: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().allow('')
      ),
      minRent: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().allow('')
      ),
      propertyType: Joi.string().valid('1bed1bath', '2bed2bath', '3bed2bath', '4bed3bath'),
    }).required(),
  }),
};

// Validation middleware functions
const validateSignup = (req, res, next) => {
  const { error } = schemas.signup.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message,
      field: error.details[0].path[0],
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = schemas.login.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message,
      field: error.details[0].path[0],
    });
  }
  next();
};

const validateSaveSearch = (req, res, next) => {
  const { error } = schemas.saveSearch.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message,
      field: error.details[0].path[0],
    });
  }
  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateSaveSearch,
};
