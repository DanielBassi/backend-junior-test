const { createDataSource } = require("./config/database");
const { authController } = require("./auth/auth.module");
const { externalDataController } = require("./external-data/external-data.module");

async function registerModules(app) {
  const dataSource = await createDataSource();
  const moduleContext = { dataSource };

  app.use("/auth", authController(moduleContext));
  app.use("/external-data", externalDataController(moduleContext));
}

module.exports = { registerModules };
