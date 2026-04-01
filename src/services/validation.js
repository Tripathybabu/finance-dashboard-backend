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

export function assertValid(errors) {
  if (errors.length === 0) {
    return;
  }

  const error = new Error("Validation failed.");
  error.statusCode = 422;
  error.details = errors;
  throw error;
}
