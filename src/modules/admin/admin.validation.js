import { z } from "zod";
import {
  objectIdSchema,
  pageSchema,
  limitSchema,
  emptyObjectPassthroughSchema,
} from "../../utils/validationPrimitives.js";

const adminListClientsSchema = z.object({
  body: emptyObjectPassthroughSchema,
  params: emptyObjectPassthroughSchema,
  query: z.object({
    page: pageSchema,
    limit: limitSchema,
    search: z.string().optional(),
  }),
});

const adminUpdateUserSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      role: z.enum(["client", "superadmin", "representative"]).optional(),
      status: z.enum(["pending", "approved", "rejected", "processing", "disabled"]).optional(),
      kycStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipCode: z.string().optional(),
      bankDetails: z.object({
        accountName: z.string().optional(),
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        ifsc: z.string().optional(),
        branchName: z.string().optional(),
      }).optional(),
      socialMedia: z.object({
        facebook: z.string().url().optional().or(z.literal("")),
        twitter: z.string().url().optional().or(z.literal("")),
        instagram: z.string().url().optional().or(z.literal("")),
        youtube: z.string().url().optional().or(z.literal("")),
      }).optional(),
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

const adminCreatePlanSchema = z.object({
  body: z.object({
    planName: z.string().trim().min(1),
    groupName: z.string().min(1),
    leverage: z.string().min(1),
    minDeposit: z.number().min(0),
    bonusType: z.string().optional(),
    ibCommission: z.string().optional(),
    mode: z.string().optional(),
    commissionPerLot: z.number().optional(),
    comment: z.string().optional(),
    active: z.boolean().optional(),
    leverageFix: z.boolean().optional(),
    selfCommission: z.boolean().optional(),
  }),
  params: emptyObjectPassthroughSchema,
  query: emptyObjectPassthroughSchema,
});

const adminCreateOrUpdateSmtpSchema = z.object({
  body: z.object({
    server: z.string().trim().min(1),
    port: z.number().positive(),
    username: z.string().trim().min(1),
    password: z.string().min(1),
    ssl: z.boolean().optional(),
    timeoutMs: z.number().optional(),
  }),
  params: emptyObjectPassthroughSchema,
  query: emptyObjectPassthroughSchema,
});

const adminCreateEmailerSchema = z.object({
  body: z.object({
    emailerType: z.string().trim().min(1),
    mailSubject: z.string().min(1),
    mailTemplateParameter: z.string().optional(),
    ccMail: z.string().optional(),
    bccMail: z.string().optional(),
    mailBody: z.string().min(1),
  }),
  params: emptyObjectPassthroughSchema,
  query: emptyObjectPassthroughSchema,
});

const adminCreateRepresentativeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(6),
    status: z.boolean().optional(),
  }),
  params: emptyObjectPassthroughSchema,
  query: emptyObjectPassthroughSchema,
});

const adminUpdateTransactionStatusSchema = z.object({
  body: z.object({
    status: z.enum(["completed", "rejected"]),
  }),
  params: z.object({
    transactionId: objectIdSchema,
  }),
  query: emptyObjectPassthroughSchema,
});

const adminListGenericSchema = z.object({
  body: emptyObjectPassthroughSchema,
  params: emptyObjectPassthroughSchema,
  query: z.object({
    page: pageSchema.optional(),
    limit: limitSchema.optional(),
    search: z.string().optional(),
  }),
});

const adminChangeUserPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6),
  }),
  params: z.object({
    userId: objectIdSchema,
  }),
  query: emptyObjectPassthroughSchema,
});

export {
  adminListClientsSchema,
  adminUpdateUserSchema,
  adminDeleteUserSchema,
  adminCreatePlanSchema,
  adminCreateOrUpdateSmtpSchema,
  adminCreateEmailerSchema,
  adminCreateRepresentativeSchema,
  adminUpdateTransactionStatusSchema,
  adminListGenericSchema,
  adminChangeUserPasswordSchema,
};
