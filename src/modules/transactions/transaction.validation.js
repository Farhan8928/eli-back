import { z } from "zod";
import {
  emptyObjectPassthroughSchema,
  objectIdSchema,
} from "../../utils/validationPrimitives.js";

const transactionCreateManualSchema = z.object({
  body: z.object({
    userId: objectIdSchema,
    type: z.enum(["deposit", "withdraw"]),
    amount: z.number().min(0.01),
    note: z.string().max(250).optional().default(""),
  }),
  params: emptyObjectPassthroughSchema,
  query: emptyObjectPassthroughSchema,
});

const transactionRequestSchema = z.object({
  body: z.object({
    amount: z.number().min(1),
    method: z.string().optional().default("bank_transfer"),
    proofUrl: z.string().optional(),
    note: z.string().max(250).optional().default(""),
  }),
  params: emptyObjectPassthroughSchema,
  query: emptyObjectPassthroughSchema,
});

export { transactionCreateManualSchema, transactionRequestSchema };
