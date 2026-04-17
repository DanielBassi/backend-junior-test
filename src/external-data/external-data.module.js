const { ExternalDataService } = require("./external-data.service");
const { createExternalDataController } = require("./external-data.controller");

function externalDataController({ dataSource }) {
  const externalItemRepository = dataSource.getRepository("ExternalItem");
  const externalDataService = new ExternalDataService(externalItemRepository);
  return createExternalDataController(externalDataService);
}

module.exports = { externalDataController };
