const Joi = require("joi");

const createMt5AccountDto = Joi.object({
  type: Joi.string().valid("demo", "live").required(),
  leverage: Joi.number().integer().min(1).max(5000).required(),
  group: Joi.string().trim().min(2).max(64).required(),
  initialDeposit: Joi.number().min(0).default(0)
});

const resetMt5PasswordDto = Joi.object({
  login: Joi.number().required(),
  newPassword: Joi.string().min(8).max(128).required()
});

module.exports = {
  createMt5AccountDto,
  resetMt5PasswordDto
};