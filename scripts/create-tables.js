require("dotenv").config();

const { createDataSource } = require("../src/config/database");

// Sincronizar el esquema TypeORM en Azure SQL Database
async function main() {
  const dataSource = await createDataSource();
  const label = `${dataSource.options.host}/${dataSource.options.database}`;
  await dataSource.destroy();
}

main().catch((error) => {
  console.error("Error al crear las tablas:", error);
  process.exit(1);
});
