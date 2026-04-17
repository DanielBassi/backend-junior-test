const { DataSource } = require("typeorm");
const { ExternalItemSchema } = require("../external-data/entities/external-item.entity");
const { UserSchema } = require("../users/entities/user.entity");

let dataSourceInstance;

const entities = [ExternalItemSchema, UserSchema];

function firstEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== "") {
      return value;
    }
  }
  return undefined;
}

function hasAzureSqlConfig() {
  const host = firstEnv("DB_HOST", "AZURE_SQL_SERVER", "HOST");
  const user = firstEnv("DB_USERNAME", "DB_USER", "MSSQL_USER", "SQL_USER");
  const password = firstEnv("DB_PASSWORD", "PASSWORD");
  const database = firstEnv("DB_NAME", "DATABASE");
  return Boolean(host && user && password && database);
}

function buildDataSourceOptions() {
  if (!hasAzureSqlConfig()) {
    throw new Error(
      "Configura Azure SQL: HOST/DB_HOST, DB_USER/DB_USERNAME, PASSWORD/DB_PASSWORD, DATABASE/DB_NAME y opcionalmente DB_PORT (1433).",
    );
  }

  const host = firstEnv("DB_HOST", "AZURE_SQL_SERVER", "HOST");
  const username = firstEnv("DB_USERNAME", "DB_USER", "MSSQL_USER", "SQL_USER");
  const password = firstEnv("DB_PASSWORD", "PASSWORD");
  const database = firstEnv("DB_NAME", "DATABASE");
  const port = Number(firstEnv("DB_PORT", "SQL_PORT") || "1433");

  return {
    type: "mssql",
    host,
    port,
    username,
    password,
    database,
    options: {
      encrypt: true,
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    },
    synchronize: process.env.TYPEORM_SYNC !== "false",
    logging: process.env.TYPEORM_LOGGING === "true",
    entities,
  };
}

async function createDataSource() {
  if (dataSourceInstance && dataSourceInstance.isInitialized) {
    return dataSourceInstance;
  }

  dataSourceInstance = new DataSource(buildDataSourceOptions());
  return dataSourceInstance.initialize();
}

async function closeDataSource() {
  if (dataSourceInstance && dataSourceInstance.isInitialized) {
    await dataSourceInstance.destroy();
  }
  dataSourceInstance = undefined;
}

module.exports = { createDataSource, closeDataSource };
