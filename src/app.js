const express = require("express");
const { registerModules } = require("./app.module");
const { errorHandler } = require("./common/middlewares/error-handler.middleware");

async function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  await registerModules(app);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
