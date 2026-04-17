const { Router } = require("express");

function createAuthController(authService) {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const { username, password } = req.body || {};
      const user = await authService.register(username, password);
      return res.status(201).json(user);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const { username, password } = req.body || {};
      const result = await authService.login(username, password);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createAuthController };
