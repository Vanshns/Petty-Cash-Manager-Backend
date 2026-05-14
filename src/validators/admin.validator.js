const { z } = require("zod");

const createAccountSchema = z.object({
  username: z.string().min(3),

  password: z.string().min(6),

  role: z.enum(["ACCOUNTANT", "CENTRE"]),

  centreName: z.string().optional(),

  minimumBalance: z.number().optional(),

  transactionLimit: z.number().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1),
});

module.exports = {
  createAccountSchema,
  createCategorySchema,
};