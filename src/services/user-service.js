import { randomUUID } from "node:crypto";
import { assertValid, validateUserInput } from "./validation.js";

function withSafeFields(user) {
  if (!user) {
    return null;
  }

  const { token, created_at, updated_at, ...safeUser } = user;

  return {
    ...safeUser,
    createdAt: user.createdAt || created_at,
    updatedAt: user.updatedAt || updated_at
  };
}

export function createUserService(userModel) {
  return {
    sanitizeUser: withSafeFields,
    async getUserByToken(token) {
      return userModel.findByToken(token);
    },
    async listUsers() {
      const users = await userModel.findAll();
      return users.map(withSafeFields);
    },
    async getUser(id) {
      const user = await userModel.findById(id);

      if (!user) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }

      return withSafeFields(user);
    },
    async createUser(payload) {
      assertValid(validateUserInput(payload, "create"));

      const normalizedEmail = payload.email.trim().toLowerCase();
      const existingUser = await userModel.findByEmail(normalizedEmail);

      if (existingUser) {
        const error = new Error("A user with this email already exists.");
        error.statusCode = 409;
        throw error;
      }

      const createdUser = await userModel.create({
        id: payload.id || randomUUID(),
        name: payload.name.trim(),
        email: normalizedEmail,
        role: payload.role,
        status: payload.status || "active",
        token: payload.token || randomUUID()
      });

      return {
        ...withSafeFields(createdUser),
        accessToken: createdUser.token
      };
    },
    async updateUser(id, payload) {
      assertValid(validateUserInput(payload, "update"));

      const currentUser = await userModel.findById(id);

      if (!currentUser) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }

      if (payload.email) {
        const existingUser = await userModel.findByEmail(payload.email.trim().toLowerCase());

        if (existingUser && existingUser.id !== id) {
          const error = new Error("Another user already uses this email.");
          error.statusCode = 409;
          throw error;
        }
      }

      const updatedUser = await userModel.update(id, {
        ...("name" in payload ? { name: payload.name.trim() } : {}),
        ...("email" in payload ? { email: payload.email.trim().toLowerCase() } : {}),
        ...("role" in payload ? { role: payload.role } : {}),
        ...("status" in payload ? { status: payload.status } : {})
      });

      return withSafeFields(updatedUser);
    }
  };
}
