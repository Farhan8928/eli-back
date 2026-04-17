const Joi = require("joi");

const createTransactionDto = Joi.object({
  userId: Joi.string().required(),
  type: Joi.string().valid("deposit", "withdraw").required(),
  amount: Joi.number().min(0.01).required(),
  note: Joi.string().max(250).allow("")
});

module.exports = { createTransactionDto };