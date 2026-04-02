import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { createApp } from "../src/app/create-app.js";
import { initializeDatabase } from "../src/database/init.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";
const { Pool } = pg;

async function resetDatabase(pool) {
  await pool.query("TRUNCATE TABLE financial_records, users RESTART IDENTITY CASCADE;");
  await initializeDatabase(pool, { seed: true });
}

async function startTestServer() {
  const pool = new Pool({
    connectionString: testDatabaseUrl
  });

  await resetDatabase(pool);

  const app = await createApp({
    pool,
    initializeDatabase: false
  });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    async request(path, options = {}) {
      const response = await fetch(`${baseUrl}${path}`, options);
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : null;
      return { response, data };
    },
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await app.close();
      await pool.end();
    }
  };
}

test(
  "swagger endpoints are available without authentication",
  { skip: !testDatabaseUrl },
  async () => {
    const api = await startTestServer();

    try {
      const specResult = await api.request("/swagger.json");

      assert.equal(specResult.response.status, 200);
      assert.equal(specResult.data.openapi, "3.0.3");
      assert.ok(specResult.data.paths["/api/records"]);

      const docsResponse = await fetch(`${api.baseUrl}/docs`);
      const docsHtml = await docsResponse.text();

      assert.equal(docsResponse.status, 200);
      assert.match(docsHtml, /SwaggerUIBundle/);
    } finally {
      await api.close();
    }
  }
);

test(
  "login returns a token that can access authenticated endpoints",
  { skip: !testDatabaseUrl },
  async () => {
    const api = await startTestServer();

    try {
      const loginResult = await api.request("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: "admin@finance.local",
          password: "Admin@123"
        })
      });

      assert.equal(loginResult.response.status, 200);
      assert.equal(loginResult.data.data.user.email, "admin@finance.local");
      assert.ok(loginResult.data.data.accessToken);
      assert.notEqual(loginResult.data.data.accessToken, "admin-token");

      const meResult = await api.request("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${loginResult.data.data.accessToken}`
        }
      });

      assert.equal(meResult.response.status, 200);
      assert.equal(meResult.data.data.email, "admin@finance.local");
    } finally {
      await api.close();
    }
  }
);

test(
  "viewer can access dashboard summary but cannot create records",
  { skip: !testDatabaseUrl },
  async () => {
    const api = await startTestServer();

    try {
      const summaryResult = await api.request("/api/dashboard/summary", {
        headers: { Authorization: "Bearer viewer-token" }
      });

      assert.equal(summaryResult.response.status, 200);
      assert.equal(summaryResult.data.data.totalIncome, 8000);
      assert.equal(summaryResult.data.data.totalExpenses, 2970);

      const createResult = await api.request("/api/records", {
        method: "POST",
        headers: {
          Authorization: "Bearer viewer-token",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 500,
          type: "income",
          category: "Sales",
          date: "2026-03-28",
          notes: "Not allowed"
        })
      });

      assert.equal(createResult.response.status, 403);
    } finally {
      await api.close();
    }
  }
);

test(
  "admin can create and analysts can filter records",
  { skip: !testDatabaseUrl },
  async () => {
    const api = await startTestServer();

    try {
      const createResult = await api.request("/api/records", {
        method: "POST",
        headers: {
          Authorization: "Bearer admin-token",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 1200,
          type: "income",
          category: "Services",
          date: "2026-03-30",
          notes: "Implementation project"
        })
      });

      assert.equal(createResult.response.status, 201);

      const listResult = await api.request("/api/records?category=Services", {
        headers: { Authorization: "Bearer analyst-token" }
      });

      assert.equal(listResult.response.status, 200);
      assert.equal(listResult.data.data.length, 1);
      assert.equal(listResult.data.meta.total, 1);
    } finally {
      await api.close();
    }
  }
);

test(
  "admin can manage users and validation failures return 422",
  { skip: !testDatabaseUrl },
  async () => {
    const api = await startTestServer();

    try {
      const invalidUserResult = await api.request("/api/users", {
        method: "POST",
        headers: {
          Authorization: "Bearer admin-token",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "",
          email: "not-an-email",
          role: "owner"
        })
      });

      assert.equal(invalidUserResult.response.status, 422);
      assert.ok(Array.isArray(invalidUserResult.data.error.details));

      const createUserResult = await api.request("/api/users", {
        method: "POST",
        headers: {
          Authorization: "Bearer admin-token",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Sam Support",
          email: "sam@finance.local",
          role: "viewer"
        })
      });

      assert.equal(createUserResult.response.status, 201);
      assert.equal(createUserResult.data.data.email, "sam@finance.local");
      assert.ok(createUserResult.data.data.accessToken);
    } finally {
      await api.close();
    }
  }
);
