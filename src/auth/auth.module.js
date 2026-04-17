const { AuthService } = require("./auth.service");
const { createAuthController } = require("./auth.controller");

function authController({ dataSource }) {
  const userRepository = dataSource.getRepository("User");
  const authService = new AuthService(userRepository);
  return createAuthController(authService);
}

module.exports = { authController };
