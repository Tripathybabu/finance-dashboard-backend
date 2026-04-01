export function extractToken(request) {
  const authorization = request.headers.authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers["x-auth-token"] || null;
}

export function authenticate(request, context) {
  const token = extractToken(request);

  if (!token) {
    return null;
  }

  return context.store.getUserByToken(token);
}

export function requireActiveUser(user) {
  if (!user) {
    const error = new Error("Authentication is required.");
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("Your account is inactive.");
    error.statusCode = 403;
    throw error;
  }
}

export function requireRole(user, roles) {
  requireActiveUser(user);

  if (!roles.includes(user.role)) {
    const error = new Error("You do not have permission to perform this action.");
    error.statusCode = 403;
    throw error;
  }
}
