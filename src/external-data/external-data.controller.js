const { Router } = require("express");
const { authMiddleware } = require("../common/middlewares/auth.middleware");

function createExternalDataController(externalDataService) {
  const router = Router();
  router.use(authMiddleware);

  router.get("/", async (_req, res, next) => {
    try {
      const data = await externalDataService.getTransformedExternalData();
      return res.json(data);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createExternalDataController };
