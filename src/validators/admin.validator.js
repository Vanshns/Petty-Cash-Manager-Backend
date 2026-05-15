// const { z } = require("zod");

// const createAccountSchema = z.object({
//   username: z.string().min(3),

//   password: z.string().min(6),

//   role: z.enum(["ACCOUNTANT", "CENTRE"]),

//   centreName: z.string().optional(),

//   minimumBalance: z.number().optional(),

//   transactionLimit: z.number().optional(),
// });

// const createCategorySchema = z.object({
//   name: z.string().min(1),
// });

// module.exports = {
//   createAccountSchema,
//   createCategorySchema,
// };

const z = require("zod");

const ROLES = require(
  "../constants/roles"
);

const createAccountSchema =
  z.object({
    username:
      z.string().min(3),

    password:
      z.string().min(6),

    role: z.enum([
      ROLES.ADMIN,
      ROLES.ACCOUNTANT,
      ROLES.CENTRE,
    ]),
  });

const createCentreSchema =
  z.object({
    name:
      z.string().min(2),

    username:
      z.string().min(3),

    password:
      z.string().min(6),

    minimumBalance:
      z.coerce.number().positive(),

    transactionLimit:
      z.coerce.number().positive(),
  });

const createCategorySchema =
  z.object({
    name:
      z.string().min(2),
  });

const resetPasswordSchema =
  z.object({
    newPassword:
      z.string().min(6),
  });

module.exports = {
  createAccountSchema,

  createCentreSchema,

  createCategorySchema,

  resetPasswordSchema,
};