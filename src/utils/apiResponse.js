const successResponse = ({
  res,
  message = "Success",
  data = null,
  statusCode = 200,
}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = ({
  res,
  message = "Something went wrong",
  errors = null,
  statusCode = 500,
}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};