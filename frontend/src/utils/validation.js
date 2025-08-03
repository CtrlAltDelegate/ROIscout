// Frontend validation utilities

export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password) => {
    return password && password.length >= 6;
  },

  required: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  zipCode: (zipCode) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  },

  price: (price) => {
    const numPrice = parseInt(price);
    return !isNaN(numPrice) && numPrice >= 0;
  },

  state: (state) => {
    return state && state.length === 2;
  }
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
    
    for (const rule of fieldRules) {
      if (typeof rule === 'function') {
        if (!rule(value)) {
          errors[field] = `Invalid ${field}`;
          break;
        }
      } else if (typeof rule === 'object') {
        if (!rule.validator(value)) {
          errors[field] = rule.message || `Invalid ${field}`;
          break;
        }
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};