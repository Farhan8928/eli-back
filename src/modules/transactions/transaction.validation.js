const { z } = require("zod");
const { emptyObjectPassthroughSchema, objectIdSchema } = require("../../utils/validationPrimitives");

const transactionCreateManualSchema = z.object({
  body: z.object({
    userId: objectIdSchema,
    type: z.enum(["deposit", "withdraw"]),
    amount: z.number().min(0.01),
    note: z.string().max(250).optional().default("")
  }),
  params: emptyObjectPassthroughSchema,
  query: emptyObjectPassthroughSchema
});

module.exports = {
  transactionCreateManualSchema
};