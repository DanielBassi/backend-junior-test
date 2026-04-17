require("dotenv").config();

const bcrypt = require("bcrypt");
const { createDataSource } = require("../src/config/database");

const SALT_ROUNDS = 10;

// Contraseña por defecto del usuario de pruebas
const DEFAULT_TEST_USERNAME = "testuser";
const DEFAULT_TEST_PASSWORD = "PruebasJunior2026!";

async function main() {
  const username = (process.env.TEST_USER_NAME || DEFAULT_TEST_USERNAME).trim();
  const plainPassword = process.env.TEST_USER_PASSWORD || DEFAULT_TEST_PASSWORD;

  if (!username || !plainPassword) {
    throw new Error("TEST_USER_NAME y contraseña (TEST_USER_PASSWORD o valor por defecto) son obligatorios.");
  }

  const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  const dataSource = await createDataSource();
  const userRepository = dataSource.getRepository("User");

  const existing = await userRepository.findOne({ where: { username } });
  if (existing) {
    existing.password = passwordHash;
    await userRepository.save(existing);
    console.log(`Usuario de pruebas actualizado: ${username}`);
  } else {
    const user = userRepository.create({ username, password: passwordHash });
    await userRepository.save(user);
    console.log(`Usuario de pruebas creado: ${username}`);
  }

  console.log("La contraseña se guarda hasheada (bcrypt). Inicia sesión con POST /auth/login usando las credenciales de tu .env.");
  await dataSource.destroy();
}

main().catch((error) => {
  console.error("Error al crear el usuario de pruebas:", error);
  process.exit(1);
});
