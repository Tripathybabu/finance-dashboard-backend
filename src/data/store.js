import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const defaultDataPath = path.resolve(process.cwd(), "data", "store.json");

const seedData = {
  users: [
    {
      id: "user-admin",
      name: "Ada Admin",
      email: "admin@finance.local",
      role: "admin",
      status: "active",
      token: "admin-token",
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-01T08:00:00.000Z"
    },
    {
      id: "user-analyst",
      name: "Nina Analyst",
      email: "analyst@finance.local",
      role: "analyst",
      status: "active",
      token: "analyst-token",
      createdAt: "2026-01-01T08:10:00.000Z",
      updatedAt: "2026-01-01T08:10:00.000Z"
    },
    {
      id: "user-viewer",
      name: "Victor Viewer",
      email: "viewer@finance.local",
      role: "viewer",
      status: "active",
      token: "viewer-token",
      createdAt: "2026-01-01T08:20:00.000Z",
      updatedAt: "2026-01-01T08:20:00.000Z"
    }
  ],
  records: [
    {
      id: "rec-001",
      amount: 5800,
      type: "income",
      category: "Consulting",
      date: "2026-03-01",
      notes: "Quarterly advisory retainer",
      createdBy: "user-admin",
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
      deletedAt: null
    },
    {
      id: "rec-002",
      amount: 1450,
      type: "expense",
      category: "Infrastructure",
      date: "2026-03-04",
      notes: "Cloud hosting and monitoring",
      createdBy: "user-admin",
      createdAt: "2026-03-04T09:15:00.000Z",
      updatedAt: "2026-03-04T09:15:00.000Z",
      deletedAt: null
    },
    {
      id: "rec-003",
      amount: 2200,
      type: "income",
      category: "Subscriptions",
      date: "2026-03-10",
      notes: "Monthly customer billing",
      createdBy: "user-analyst",
      createdAt: "2026-03-10T14:00:00.000Z",
      updatedAt: "2026-03-10T14:00:00.000Z",
      deletedAt: null
    },
    {
      id: "rec-004",
      amount: 620,
      type: "expense",
      category: "Marketing",
      date: "2026-03-15",
      notes: "Campaign design spend",
      createdBy: "user-admin",
      createdAt: "2026-03-15T13:30:00.000Z",
      updatedAt: "2026-03-15T13:30:00.000Z",
      deletedAt: null
    },
    {
      id: "rec-005",
      amount: 900,
      type: "expense",
      category: "Operations",
      date: "2026-03-22",
      notes: "Contractor support",
      createdBy: "user-admin",
      createdAt: "2026-03-22T11:45:00.000Z",
      updatedAt: "2026-03-22T11:45:00.000Z",
      deletedAt: null
    }
  ]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sortByDateDescending(records) {
  return [...records].sort((left, right) => {
    const leftValue = new Date(left.date).getTime();
    const rightValue = new Date(right.date).getTime();
    return rightValue - leftValue;
  });
}

export function createStore(options = {}) {
  const dataPath = options.dataPath || defaultDataPath;
  const persist = options.persist !== false;

  ensureDirectory(dataPath);

  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(seedData, null, 2));
  }

  let state = persist
    ? JSON.parse(fs.readFileSync(dataPath, "utf8"))
    : clone(seedData);

  function save() {
    if (!persist) {
      return;
    }

    fs.writeFileSync(dataPath, JSON.stringify(state, null, 2));
  }

  return {
    getUsers() {
      return clone(state.users);
    },
    getUserById(id) {
      return clone(state.users.find((user) => user.id === id) || null);
    },
    getUserByEmail(email) {
      return clone(state.users.find((user) => user.email === email) || null);
    },
    getUserByToken(token) {
      return clone(state.users.find((user) => user.token === token) || null);
    },
    createUser(payload) {
      const now = new Date().toISOString();
      const user = {
        id: payload.id || randomUUID(),
        createdAt: now,
        updatedAt: now,
        ...payload
      };

      state.users.push(user);
      save();
      return clone(user);
    },
    updateUser(id, updates) {
      const user = state.users.find((entry) => entry.id === id);

      if (!user) {
        return null;
      }

      Object.assign(user, updates, { updatedAt: new Date().toISOString() });
      save();
      return clone(user);
    },
    getRecords() {
      return sortByDateDescending(state.records.filter((record) => !record.deletedAt));
    },
    getRecordById(id) {
      const record = state.records.find((entry) => entry.id === id && !entry.deletedAt);
      return clone(record || null);
    },
    createRecord(payload) {
      const now = new Date().toISOString();
      const record = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        ...payload
      };

      state.records.push(record);
      save();
      return clone(record);
    },
    updateRecord(id, updates) {
      const record = state.records.find((entry) => entry.id === id && !entry.deletedAt);

      if (!record) {
        return null;
      }

      Object.assign(record, updates, { updatedAt: new Date().toISOString() });
      save();
      return clone(record);
    },
    deleteRecord(id) {
      const record = state.records.find((entry) => entry.id === id && !entry.deletedAt);

      if (!record) {
        return null;
      }

      record.deletedAt = new Date().toISOString();
      record.updatedAt = record.deletedAt;
      save();
      return clone(record);
    }
  };
}
