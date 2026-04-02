import { sendJson } from "../lib/http/send-response.js";
import { requireRole } from "../middleware/auth.js";
import { createRequestContext, methodNotAllowed } from "./helpers.js";

export async function handleUserRoutes(request, response, context, url, segments, user, requestBody) {
  const [, resource, resourceId] = segments;

  if (resource !== "users") {
    return false;
  }

  requireRole(user, ["admin"]);

  if (segments.length === 2) {
    if (request.method === "GET") {
      const result = await context.controllers.users.listUsers();
      sendJson(response, result.statusCode, result.body);
      return true;
    }

    if (request.method === "POST") {
      const result = await context.controllers.users.createUser({ body: requestBody });
      sendJson(response, result.statusCode, result.body);
      return true;
    }

    throw methodNotAllowed(request.method);
  }

  if (segments.length === 3) {
    const requestContext = createRequestContext(request, url, user, { userId: resourceId });

    if (request.method === "GET") {
      const result = await context.controllers.users.getUser(requestContext);
      sendJson(response, result.statusCode, result.body);
      return true;
    }

    if (request.method === "PATCH") {
      const result = await context.controllers.users.updateUser({
        ...requestContext,
        body: requestBody
      });
      sendJson(response, result.statusCode, result.body);
      return true;
    }

    throw methodNotAllowed(request.method);
  }

  return false;
}
