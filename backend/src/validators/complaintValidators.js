import Joi from 'joi';

const validateComplaint = (complaint) => {
  const schema = Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(5000).required(),
    category: Joi.string().valid('Billing', 'Technical', 'Service', 'Product', 'General').optional(),
    attachments: Joi.array().items(Joi.string()).optional()
  });

  return schema.validate(complaint);
};

const validateComplaintUpdate = (update) => {
  const schema = Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    type: Joi.string().valid('status_change', 'comment', 'assignment', 'escalation', 'resolution').optional(),
    isInternal: Joi.boolean().optional(),
    attachments: Joi.array().items(Joi.string()).optional()
  });

  return schema.validate(update);
};

const validateComplaintFilter = (filter) => {
  const schema = Joi.object({
    status: Joi.string().valid('Open', 'In Progress', 'Under Review', 'Resolved', 'Closed', 'Escalated').optional(),
    category: Joi.string().valid('Billing', 'Technical', 'Service', 'Product', 'General').optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
    assignedTo: Joi.string().optional(),
    userId: Joi.string().optional(),
    isEscalated: Joi.boolean().optional(),
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'slaTarget', 'priority', 'status').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  });

  return schema.validate(filter);
};

const validateFeedback = (feedback) => {
  const schema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(1000).optional().allow('')
  });

  return schema.validate(feedback);
};

export {
  validateComplaint,
  validateComplaintUpdate,
  validateComplaintFilter,
  validateFeedback
};
