import { scryptSync, randomBytes } from "node:crypto";
import { seedRecords, seedUsers } from "./seed-data.js";

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

async function createSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      password_hash VARCHAR(255),
      role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      token VARCHAR(160) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id TEXT PRIMARY KEY,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
      category VARCHAR(120) NOT NULL,
      date DATE NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_financial_records_date
    ON financial_records (date DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_financial_records_type
    ON financial_records (type);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_financial_records_category
    ON financial_records (category);
  `);
}

async function seedUsersTable(pool) {
  for (const user of seedUsers) {
    await pool.query(
      `
        INSERT INTO users (id, name, email, password_hash, role, status, token)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;
      `,
      [
        user.id,
        user.name,
        user.email,
        hashPassword(user.password),
        user.role,
        user.status,
        user.token
      ]
    );
  }
}

async function backfillSeedUserPasswords(pool) {
  for (const user of seedUsers) {
    await pool.query(
      `
        UPDATE users
        SET password_hash = COALESCE(password_hash, $2)
        WHERE email = $1;
      `,
      [user.email, hashPassword(user.password)]
    );
  }
}

async function seedRecordsTable(pool) {
  for (const record of seedRecords) {
    await pool.query(
      `
        INSERT INTO financial_records (id, amount, type, category, date, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;
      `,
      [
        record.id,
        record.amount,
        record.type,
        record.category,
        record.date,
        record.notes,
        record.createdBy
      ]
    );
  }
}

export async function initializeDatabase(pool, options = {}) {
  await createSchema(pool);
  await backfillSeedUserPasswords(pool);

  if (options.seed === false) {
    return;
  }

  const result = await pool.query("SELECT COUNT(*)::int AS count FROM users;");

  if (result.rows[0].count > 0) {
    return;
  }

  await seedUsersTable(pool);
  await seedRecordsTable(pool);
}
