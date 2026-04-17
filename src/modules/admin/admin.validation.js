const { z } = require("zod");
const {
  objectIdSchema,
  pageSchema,
  limitSchema,
  emptyObjectPassthroughSchema,
} = require("../../utils/validationPrimitives");

const adminListClientsSchema = z.object({
  body: emptyObjectPassthroughSchema,
  params: emptyObjectPassthroughSchema,
  query: z.object({
    page: pageSchema,
    limit: limitSchema,
  }),
});

const adminUpdateUserSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      role: z.enum(["client", "superadmin"]).optional(),
      kycStatus: z.enum(["pending", "approved", "rejected"]).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "At least one field is required",
    }),
  params: z.object({
    userId: objectIdSchema,
  }),
  query: emptyObjectPassthroughSchema,
});

const adminDeleteUserSchema = z.object({
  body: emptyObjectPassthroughSchema,
  params: z.object({
    userId: objectIdSchema,
  }),
  query: emptyObjectPassthroughSchema,
});

module.exports = {
  adminListClientsSchema,
  adminUpdateUserSchema,
  adminDeleteUserSchema,
};
