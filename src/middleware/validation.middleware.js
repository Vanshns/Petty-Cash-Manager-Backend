// const validationMiddleware = (schema) => {
//   return async (req, res, next) => {
//     try {
//       req.validatedData = await schema.parseAsync(req.body);

//       next();
//     } catch (error) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: error.errors,
//       });
//     }
//   };
// };



const validationMiddleware = (schema) => {
  return async (
    req,
    res,
    next
  ) => {
    try {
      req.validatedData =
        await schema.parseAsync(
          req.body
        );

      next();
    } catch (error) {
      console.log(error);

      return res.status(400).json({
        success: false,

        message:
          "Validation failed",

        errors:
          error.errors ||
          error.issues ||
          error.message,
      });
    }
  };
};

module.exports = validationMiddleware;