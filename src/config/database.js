import pg from "pg";

const { Pool } = pg;

export function getDatabaseConfig(overrides = {}) {
  return {
    host: overrides.host || process.env.DB_HOST || "127.0.0.1",
    port: Number(overrides.port || process.env.DB_PORT || 5432),
    database: overrides.database || process.env.DB_NAME || "finance_dashboard",
    user: overrides.user || process.env.DB_USER || "postgres",
    password: overrides.password || process.env.DB_PASSWORD || "postgres",
    connectionString: overrides.connectionString || process.env.DATABASE_URL || undefined,
    ssl:
      overrides.ssl ??
      (process.env.DB_SSL === "true"
        ? {
            rejectUnauthorized: false
          }
        : false)
  };
}

export function createDatabasePool(overrides = {}) {
  const config = getDatabaseConfig(overrides);

  if (config.connectionString) {
    return new Pool({
      connectionString: config.connectionString,
      ssl: config.ssl
    });
  }

  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl
  });
}
