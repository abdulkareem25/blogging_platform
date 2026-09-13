import ApiError from "../utils/ApiError.js";

const validate = (schema, property) => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });

  if (error) {
    return next(new ApiError(
      400,
      "Validation failed",
      error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }))
    ));
  }

  Object.defineProperty(req, property, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
  return next();
};

export const validateBody = (schema) => validate(schema, "body");
export const validateQuery = (schema) => validate(schema, "query");

export default validate;
