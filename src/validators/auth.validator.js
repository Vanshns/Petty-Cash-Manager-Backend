const { z } = require("zod");

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

module.exports = {
  loginSchema,
};