const roles = ["viewer", "analyst", "admin"];
const statuses = ["active", "inactive"];
const recordTypes = ["income", "expense"];

function pushError(errors, field, message) {
  errors.push({ field, message });
}

function isBlank(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

export function validateUserInput(payload, mode = "create") {
  const errors = [];

  if (mode === "create" || "name" in payload) {
    if (isBlank(payload.name)) {
      pushError(errors, "name", "Name is required.");
    }
  }

  if (mode === "create" || "email" in payload) {
    if (isBlank(payload.email)) {
      pushError(errors, "email", "Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      pushError(errors, "email", "Email must be valid.");
    }
  }

  if (mode === "create" || "role" in payload) {
    if (!roles.includes(payload.role)) {
      pushError(errors, "role", `Role must be one of: ${roles.join(", ")}.`);
    }
  }

  if ("status" in payload && !statuses.includes(payload.status)) {
    pushError(errors, "status", `Status must be one of: ${statuses.join(", ")}.`);
  }

  return errors;
}

export function validateRecordInput(payload, mode = "create") {
  const errors = [];

  if (mode === "create" || "amount" in payload) {
    if (typeof payload.amount !== "number" || payload.amount <= 0) {
      pushError(errors, "amount", "Amount must be a positive number.");
    }
  }

  if (mode === "create" || "type" in payload) {
    if (!recordTypes.includes(payload.type)) {
      pushError(errors, "type", `Type must be one of: ${recordTypes.join(", ")}.`);
    }
  }

  if (mode === "create" || "category" in payload) {
    if (isBlank(payload.category)) {
      pushError(errors, "category", "Category is required.");
    }
  }

  if (mode === "create" || "date" in payload) {
    if (!isValidDate(payload.date)) {
      pushError(errors, "date", "Date must use YYYY-MM-DD format.");
    }
  }

  if ("notes" in payload && payload.notes != null && typeof payload.notes !== "string") {
    pushError(errors, "notes", "Notes must be a string.");
  }

  return errors;
}

export function validateRecordQuery(query = {}) {
  const errors = [];

  if ("type" in query && query.type && !recordTypes.includes(query.type)) {
    pushError(errors, "type", `Type must be one of: ${recordTypes.join(", ")}.`);
  }

  if ("startDate" in query && query.startDate && !isValidDate(query.startDate)) {
    pushError(errors, "startDate", "Start date must use YYYY-MM-DD format.");
  }

  if ("endDate" in query && query.endDate && !isValidDate(query.endDate)) {
    pushError(errors, "endDate", "End date must use YYYY-MM-DD format.");
  }

  if (
    query.startDate &&
    query.endDate &&
    isValidDate(query.startDate) &&
    isValidDate(query.endDate) &&
    query.startDate > query.endDate
  ) {
    pushError(errors, "dateRange", "Start date must be before or equal to end date.");
  }

  if ("page" in query && query.page) {
    const page = Number(query.page);

    if (!Number.isInteger(page) || page < 1) {
      pushError(errors, "page", "Page must be an integer greater than or equal to 1.");
    }
  }

  if ("pageSize" in query && query.pageSize) {
    const pageSize = Number(query.pageSize);

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      pushError(errors, "pageSize", "Page size must be an integer between 1 and 100.");
    }
  }

  return errors;
}

export function validateTrendQuery(query = {}) {
  const errors = validateRecordQuery(query);

  if ("granularity" in query && query.granularity && !["monthly", "weekly"].includes(query.granularity)) {
    pushError(errors, "granularity", "Granularity must be either monthly or weekly.");
  }

  return errors;
}

export function validateRecentActivityQuery(query = {}) {
  const errors = [];

  if ("limit" in query && query.limit) {
    const limit = Number(query.limit);

    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      pushError(errors, "limit", "Limit must be an integer between 1 and 20.");
    }
  }

  return errors;
}

export function assertValid(errors) {
  if (errors.length === 0) {
    return;
  }

  const error = new Error("Validation failed.");
  error.statusCode = 422;
  error.details = errors;
  throw error;
}
