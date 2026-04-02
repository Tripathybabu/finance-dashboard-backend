export const seedUsers = [
  {
    id: "user-admin",
    name: "Ada Admin",
    email: "admin@finance.local",
    role: "admin",
    status: "active",
    token: "admin-token"
  },
  {
    id: "user-analyst",
    name: "Nina Analyst",
    email: "analyst@finance.local",
    role: "analyst",
    status: "active",
    token: "analyst-token"
  },
  {
    id: "user-viewer",
    name: "Victor Viewer",
    email: "viewer@finance.local",
    role: "viewer",
    status: "active",
    token: "viewer-token"
  }
];

export const seedRecords = [
  {
    id: "rec-001",
    amount: 5800,
    type: "income",
    category: "Consulting",
    date: "2026-03-01",
    notes: "Quarterly advisory retainer",
    createdBy: "user-admin"
  },
  {
    id: "rec-002",
    amount: 1450,
    type: "expense",
    category: "Infrastructure",
    date: "2026-03-04",
    notes: "Cloud hosting and monitoring",
    createdBy: "user-admin"
  },
  {
    id: "rec-003",
    amount: 2200,
    type: "income",
    category: "Subscriptions",
    date: "2026-03-10",
    notes: "Monthly customer billing",
    createdBy: "user-analyst"
  },
  {
    id: "rec-004",
    amount: 620,
    type: "expense",
    category: "Marketing",
    date: "2026-03-15",
    notes: "Campaign design spend",
    createdBy: "user-admin"
  },
  {
    id: "rec-005",
    amount: 900,
    type: "expense",
    category: "Operations",
    date: "2026-03-22",
    notes: "Contractor support",
    createdBy: "user-admin"
  }
];
