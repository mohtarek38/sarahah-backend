const requestKeys = ["body", "params", "query", "headers"];

export const validationMiddleware = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];
    for (const key of requestKeys) {
      if (schema[key]) {
        const { error } = schema[key].validate(req[key], { abortEarly: false });
        if (error) {
          validationErrors.push(...error.details);
        }
      }
    }
    if (validationErrors.length) {
      console.log(validationErrors);
      return res.status(400).json({
        message: "Validation Error",
        errors: validationErrors.map((err) => err.message),
      });
    }
    next();
  };
};
