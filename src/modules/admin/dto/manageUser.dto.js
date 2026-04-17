const Joi = require("joi");

const updateUserDto = Joi.object({
  name: Joi.string().min(2).max(120),
  role: Joi.string().valid("client", "superadmin"),
  kycStatus: Joi.string().valid("pending", "approved", "rejected")
}).min(1);

const userQueryDto = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = {
  updateUserDto,
  userQueryDto
};