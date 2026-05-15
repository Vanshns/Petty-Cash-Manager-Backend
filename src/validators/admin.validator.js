const z = require("zod");

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

const createAdminSchema =
  z.object({
    username:
      z.string().min(3),

    password:
      z.string().min(6),
  });

/*
|--------------------------------------------------------------------------
| Accountant
|--------------------------------------------------------------------------
*/

const createAccountantSchema =
  z.object({
    username:
      z.string().min(3),

    password:
      z.string().min(6),
  });

/*
|--------------------------------------------------------------------------
| Centre
|--------------------------------------------------------------------------
*/

const createCentreSchema =
  z.object({
    centreName:
      z.string().min(2),

    username:
      z.string().min(3),

    password:
      z.string().min(6),

    minimumBalance:
      z.coerce
        .number()
        .positive(),

    transactionLimit:
      z.coerce
        .number()
        .positive(),
  });

/*
|--------------------------------------------------------------------------
| Category
|--------------------------------------------------------------------------
*/

const createCategorySchema =
  z.object({
    name:
      z.string().min(2),
  });

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/

const resetPasswordSchema =
  z.object({
    newPassword:
      z.string().min(6),
  });

module.exports = {
  createAdminSchema,

  createAccountantSchema,

  createCentreSchema,

  createCategorySchema,

  resetPasswordSchema,
};