const Joi = require("joi");

const registerDto = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required()
});

module.exports = { registerDto };