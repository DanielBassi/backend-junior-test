const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { AppError } = require("../common/errors/app-error");

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }
  return secret;
}

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register(username, password) {
    const trimmed = String(username || "").trim();
    if (!trimmed || !password) {
      throw new AppError("Username and password are required", 400);
    }

    const existing = await this.userRepository.findOne({ where: { username: trimmed } });
    if (existing) {
      throw new AppError("Username already taken", 409);
    }

    const hash = await bcrypt.hash(String(password), SALT_ROUNDS);
    const user = this.userRepository.create({ username: trimmed, password: hash });
    await this.userRepository.save(user);

    return { id: user.id, username: user.username };
  }

  async login(username, password) {
    const trimmed = String(username || "").trim();
    if (!trimmed || !password) {
      throw new AppError("Username and password are required", 400);
    }

    const user = await this.userRepository.findOne({ where: { username: trimmed } });
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const match = await bcrypt.compare(String(password), user.password);
    if (!match) {
      throw new AppError("Invalid credentials", 401);
    }

    const secret = getJwtSecret();
    const accessToken = jwt.sign(
      { sub: user.id, username: user.username },
      secret,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: JWT_EXPIRES_IN,
    };
  }
}

module.exports = { AuthService };
