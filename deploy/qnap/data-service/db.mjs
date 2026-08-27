import pg from "pg";

const { Pool } = pg;

export function createPool() {
  const required = ["NK_DB_HOST", "NK_DB_NAME", "NK_DB_USER", "NK_DB_PASSWORD"];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`missing_${key.toLowerCase()}`);
  }
  return new Pool({
    host: process.env.NK_DB_HOST,
    port: Number(process.env.NK_DB_PORT || 5432),
    database: process.env.NK_DB_NAME,
    user: process.env.NK_DB_USER,
    password: process.env.NK_DB_PASSWORD,
    max: Number(process.env.NK_DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: "nk-cars-data-service",
  });
}
