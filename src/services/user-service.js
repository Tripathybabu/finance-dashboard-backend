import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { assertValid, validateUserInput } from "./validation.js";

function withSafeFields(user) {
  if (!user) {
    return null;
  }

  const { token, password_hash, created_at, updated_at, ...safeUser } = user;

  return {
    ...safeUser,
    createdAt: user.createdAt || created_at,
    updatedAt: user.updatedAt || updated_at
  };
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, passwordHash) {
  if (!passwordHash) {
    return false;
  }

  const [salt, storedKey] = passwordHash.split(":");

  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedKey, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
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
        passwordHash: "password" in payload ? hashPassword(payload.password) : null,
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
        ...("password" in payload ? { passwordHash: hashPassword(payload.password) } : {}),
        ...("role" in payload ? { role: payload.role } : {}),
        ...("status" in payload ? { status: payload.status } : {})
      });

      return withSafeFields(updatedUser);
    },
    async login(payload) {
      const email = payload.email?.trim().toLowerCase();
      const password = payload.password || "";

      if (!email || !password) {
        const error = new Error("Email and password are required.");
        error.statusCode = 422;
        error.details = [
          ...(!email ? [{ field: "email", message: "Email is required." }] : []),
          ...(!password ? [{ field: "password", message: "Password is required." }] : [])
        ];
        throw error;
      }

      const user = await userModel.findByEmail(email);

      if (!user || !verifyPassword(password, user.password_hash)) {
        const error = new Error("Invalid email or password.");
        error.statusCode = 401;
        throw error;
      }

      if (user.status !== "active") {
        const error = new Error("Your account is inactive.");
        error.statusCode = 403;
        throw error;
      }

      const accessToken = randomUUID();
      const authenticatedUser = await userModel.updateToken(user.id, accessToken);

      return {
        user: withSafeFields(authenticatedUser),
        accessToken
      };
    }
  };
}
