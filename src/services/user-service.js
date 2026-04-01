import { randomUUID } from "node:crypto";
import { assertValid, validateUserInput } from "./validation.js";

function withSafeFields(user) {
  if (!user) {
    return null;
  }

  const { token, ...safeUser } = user;
  return safeUser;
}

export function createUserService(store) {
  return {
    sanitizeUser: withSafeFields,
    listUsers() {
      return store.getUsers().map(withSafeFields);
    },
    getUser(id) {
      const user = store.getUserById(id);

      if (!user) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }

      return withSafeFields(user);
    },
    createUser(payload) {
      assertValid(validateUserInput(payload, "create"));

      if (store.getUserByEmail(payload.email.trim().toLowerCase())) {
        const error = new Error("A user with this email already exists.");
        error.statusCode = 409;
        throw error;
      }

      const createdUser = store.createUser({
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role,
        status: payload.status || "active",
        token: payload.token || randomUUID()
      });

      return {
        ...withSafeFields(createdUser),
        accessToken: createdUser.token
      };
    },
    updateUser(id, payload) {
      assertValid(validateUserInput(payload, "update"));

      const currentUser = store.getUserById(id);

      if (!currentUser) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }

      if (payload.email) {
        const existingUser = store.getUserByEmail(payload.email.trim().toLowerCase());

        if (existingUser && existingUser.id !== id) {
          const error = new Error("Another user already uses this email.");
          error.statusCode = 409;
          throw error;
        }
      }

      const updatedUser = store.updateUser(id, {
        ...(payload.name ? { name: payload.name.trim() } : {}),
        ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
        ...(payload.role ? { role: payload.role } : {}),
        ...(payload.status ? { status: payload.status } : {})
      });

      return withSafeFields(updatedUser);
    }
  };
}
