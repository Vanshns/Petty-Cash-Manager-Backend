const { z } = require("zod");

const createTransactionSchema = z.object({
  amount: z.coerce.number().positive(),

  categoryId: z.string().uuid(),

  description: z.string().optional(),
});

module.exports = {
  createTransactionSchema,
};