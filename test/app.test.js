import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

async function startTestServer() {
  const app = createApp({
    persist: false
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
      const data = await response.json();
      return { response, data };
    },
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}

test("viewer can access dashboard summary but cannot create records", async () => {
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
});

test("admin can create and analysts can filter records", async () => {
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
});

test("admin can manage users and validation failures return 422", async () => {
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
});
