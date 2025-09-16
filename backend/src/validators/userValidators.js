import Joi from 'joi';

const validateUser = (user) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      }),
    role: Joi.string().valid('user', 'agent', 'admin', 'analytics').optional(),
    department: Joi.string().valid('Billing', 'Technical', 'Customer Service', 'Product', 'General').optional(),
    profile: Joi.object({
      phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
      address: Joi.string().max(200).optional(),
      company: Joi.string().max(100).optional(),
      jobTitle: Joi.string().max(100).optional()
    }).optional(),
    preferences: Joi.object({
      emailNotifications: Joi.boolean().optional(),
      smsNotifications: Joi.boolean().optional(),
      language: Joi.string().optional(),
      timezone: Joi.string().optional()
    }).optional()
  });

  return schema.validate(user);
};

const validateLogin = (credentials) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(credentials);
};

const validateUserUpdate = (user) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    department: Joi.string().valid('Billing', 'Technical', 'Customer Service', 'Product', 'General').optional(),
    isActive: Joi.boolean().optional(),
    profile: Joi.object({
      phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).allow('').optional(),
      address: Joi.string().max(200).allow('').optional(),
      company: Joi.string().max(100).allow('').optional(),
      jobTitle: Joi.string().max(100).allow('').optional()
    }).optional(),
    preferences: Joi.object({
      emailNotifications: Joi.boolean().optional(),
      smsNotifications: Joi.boolean().optional(),
      language: Joi.string().optional(),
      timezone: Joi.string().optional()
    }).optional()
  });

  return schema.validate(user);
};

const validatePasswordChange = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      })
  });

  return schema.validate(data);
};

export {
  validateUser,
  validateLogin,
  validateUserUpdate,
  validatePasswordChange
};
