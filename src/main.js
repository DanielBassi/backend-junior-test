require("dotenv").config();

const { createApp } = require("./app");
const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap app:", error);
  process.exit(1);
});
