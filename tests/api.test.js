require("dotenv").config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-jwt-secret";
}

const request = require("supertest");
const axios = require("axios");
const { createApp } = require("../src/app");
const { closeDataSource } = require("../src/config/database");

jest.mock("axios");

function hasAzureSqlEnv() {
  const host = process.env.DB_HOST || process.env.AZURE_SQL_SERVER || process.env.HOST;
  const user = process.env.DB_USERNAME || process.env.DB_USER || process.env.MSSQL_USER || process.env.SQL_USER;
  const password = process.env.DB_PASSWORD || process.env.PASSWORD;
  const database = process.env.DB_NAME || process.env.DATABASE;
  return Boolean(host && user && password && database);
}

const describeApi = hasAzureSqlEnv() ? describe : describe.skip;

describeApi("API", () => {
  afterAll(async () => {
    await closeDataSource();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns health status", async () => {
    const app = await createApp();
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns 401 when bearer token is missing", async () => {
    const app = await createApp();
    const response = await request(app).get("/external-data");

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("returns transformed external data with valid JWT", async () => {
    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Alice",
          email: "alice@mail.com",
          company: { name: "Acme" },
        },
      ],
    });

    const app = await createApp();
    const uniqueUser = `alice_${Date.now()}`;

    await request(app).post("/auth/register").send({
      username: uniqueUser,
      password: "secret123",
    });

    const loginRes = await request(app).post("/auth/login").send({
      username: uniqueUser,
      password: "secret123",
    });

    expect(loginRes.statusCode).toBe(200);
    const token = loginRes.body.accessToken;

    const response = await request(app)
      .get("/external-data")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Alice",
        email: "alice@mail.com",
        company: "Acme",
      },
    ]);
  });
});
