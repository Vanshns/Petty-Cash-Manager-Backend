const queryValidationMiddleware =
  (schema) => {
    return async (req, res, next) => {
      try {
        req.validatedQuery =
          await schema.parseAsync(req.query);

        next();
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid query params",
          errors: error.errors,
        });
      }
    };
  };

module.exports =
  queryValidationMiddleware;