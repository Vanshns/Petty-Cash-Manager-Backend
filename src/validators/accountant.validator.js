const { z } = require("zod");

const updateBalanceSchema = z.object({
  amount: z.number().positive(),

  note: z.string().optional(),
});

const approveRejectSchema = z.object({
  rejectionReason: z.string().optional(),
});
const historyQuerySchema = z.object({
  status: z
    .enum([
      "STANDARD",
      "PENDING_APPROVAL",
      "APPROVED_PENDING_BILL",
      "APPROVED_COMPLETED",
      "REJECTED",
    ])
    .optional(),

  startDate: z.string().optional(),

  endDate: z.string().optional(),

  centreId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).optional(), // Pagination
  limit: z.coerce.number().min(1).max(100).optional(), // Pagination
});

module.exports = {
  updateBalanceSchema,
  approveRejectSchema,
  historyQuerySchema,
};