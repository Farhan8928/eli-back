const { z } = require("zod");
const {
  emptyObjectPassthroughSchema,
  emailSchema
} = require("../../utils/validationPrimitives");

const authRegisterSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: emailSchema(),
    password: z.string().min(8).max(128)
  }),
  params: emptyObjectPassthroughSchema,
  query: emptyObjectPassthroughSchema
});

const authLoginSchema = z.object({
  body: z.object({
    email: emailSchema(),
    password: z.string().min(1, "Password is required")
  }),
  params: emptyObjectPassthroughSchema,
  query: emptyObjectPassthroughSchema
});

module.exports = {
  authRegisterSchema,
  authLoginSchema
};