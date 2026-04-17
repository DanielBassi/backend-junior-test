const jwt = require("jsonwebtoken");
const { AppError } = require("../errors/app-error");

function getJwtSecret() {
  return process.env.JWT_SECRET;
}

function authMiddleware(req, _res, next) {
  const secret = getJwtSecret();
  if (!secret) {
    return next(new AppError("JWT_SECRET is not configured", 500));
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = {
      id: payload.sub,
      username: payload.username,
    };
    return next();
  } catch {
    return next(new AppError("Unauthorized", 401));
  }
}

module.exports = { authMiddleware };
