const { AppError } = require("../errors/app-error");

function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Unhandled error:", error);
  return res.status(500).json({ error: "Unexpected internal error" });
}

module.exports = { errorHandler };
