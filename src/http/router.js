import { readJsonBody } from "./body.js";
import { authenticate, requireRole, requireActiveUser } from "./auth.js";
import { sendError, sendJson } from "./response.js";

function parseUrl(request) {
  return new URL(request.url, "http://localhost");
}

function getPathSegments(url) {
  return url.pathname.split("/").filter(Boolean);
}

function parseQuery(url) {
  return Object.fromEntries(url.searchParams.entries());
}

function allowMethods(request, methods) {
  if (!methods.includes(request.method)) {
    const error = new Error(`Method ${request.method} is not allowed on this endpoint.`);
    error.statusCode = 405;
    throw error;
  }
}

function notFoundError() {
  const error = new Error("The requested resource was not found.");
  error.statusCode = 404;
  return error;
}

async function handleUsers(request, response, context, user, segments) {
  if (segments.length === 2) {
    allowMethods(request, ["GET", "POST"]);
    requireRole(user, ["admin"]);

    if (request.method === "GET") {
      sendJson(response, 200, {
        data: context.services.users.listUsers()
      });
      return;
    }

    const body = await readJsonBody(request);
    const createdUser = context.services.users.createUser(body);
    sendJson(response, 201, {
      data: createdUser
    });
    return;
  }

  if (segments.length === 3) {
    allowMethods(request, ["GET", "PATCH"]);
    requireRole(user, ["admin"]);
    const userId = segments[2];

    if (request.method === "GET") {
      sendJson(response, 200, {
        data: context.services.users.getUser(userId)
      });
      return;
    }

    const body = await readJsonBody(request);
    sendJson(response, 200, {
      data: context.services.users.updateUser(userId, body)
    });
    return;
  }

  throw notFoundError();
}

async function handleAuth(request, response, context, user, segments) {
  if (segments.length === 3 && segments[2] === "me") {
    allowMethods(request, ["GET"]);
    requireActiveUser(user);

    sendJson(response, 200, {
      data: context.services.users.sanitizeUser(user)
    });
    return;
  }

  throw notFoundError();
}

async function handleRecords(request, response, context, user, url, segments) {
  if (segments.length === 2) {
    allowMethods(request, ["GET", "POST"]);

    if (request.method === "GET") {
      requireRole(user, ["admin", "analyst"]);
      sendJson(response, 200, context.services.records.listRecords(parseQuery(url)));
      return;
    }

    requireRole(user, ["admin"]);
    const body = await readJsonBody(request);
    sendJson(response, 201, {
      data: context.services.records.createRecord(body, user)
    });
    return;
  }

  if (segments.length === 3) {
    allowMethods(request, ["GET", "PATCH", "DELETE"]);
    const recordId = segments[2];

    if (request.method === "GET") {
      requireRole(user, ["admin", "analyst"]);
      sendJson(response, 200, {
        data: context.services.records.getRecord(recordId)
      });
      return;
    }

    if (request.method === "PATCH") {
      requireRole(user, ["admin"]);
      const body = await readJsonBody(request);
      sendJson(response, 200, {
        data: context.services.records.updateRecord(recordId, body)
      });
      return;
    }

    requireRole(user, ["admin"]);
    context.services.records.deleteRecord(recordId);
    sendJson(response, 200, {
      data: { id: recordId, deleted: true }
    });
    return;
  }

  throw notFoundError();
}

async function handleDashboard(request, response, context, user, url, segments) {
  requireRole(user, ["admin", "analyst", "viewer"]);

  if (segments.length === 3 && segments[2] === "summary") {
    allowMethods(request, ["GET"]);
    sendJson(response, 200, {
      data: context.services.dashboard.getSummary(parseQuery(url))
    });
    return;
  }

  if (segments.length === 3 && segments[2] === "trends") {
    allowMethods(request, ["GET"]);
    sendJson(response, 200, {
      data: context.services.dashboard.getTrends(parseQuery(url))
    });
    return;
  }

  if (segments.length === 3 && segments[2] === "recent-activity") {
    allowMethods(request, ["GET"]);
    sendJson(response, 200, {
      data: context.services.dashboard.getRecentActivity(parseQuery(url))
    });
    return;
  }

  throw notFoundError();
}

export async function handleRequest(request, response, context) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    const url = parseUrl(request);
    const segments = getPathSegments(url);
    const user = authenticate(request, context);

    if (segments.length === 1 && segments[0] === "health") {
      sendJson(response, 200, {
        status: "ok",
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (segments[0] !== "api") {
      throw notFoundError();
    }

    if (segments[1] === "users") {
      await handleUsers(request, response, context, user, segments);
      return;
    }

    if (segments[1] === "auth") {
      await handleAuth(request, response, context, user, segments);
      return;
    }

    if (segments[1] === "records") {
      await handleRecords(request, response, context, user, url, segments);
      return;
    }

    if (segments[1] === "dashboard") {
      await handleDashboard(request, response, context, user, url, segments);
      return;
    }

    throw notFoundError();
  } catch (error) {
    sendError(
      response,
      error.statusCode || 500,
      error.message || "Internal server error.",
      error.details || null
    );
  }
}
