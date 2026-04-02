import { sendJson } from "../lib/http/send-response.js";
import { requireActiveUser } from "../middleware/auth.js";
import { createRequestContext, methodNotAllowed } from "./helpers.js";

export async function handleAuthRoutes(request, response, context, url, segments, user, requestBody) {
  const [, resource, resourceId] = segments;

  if (resource !== "auth" || segments.length !== 3) {
    return false;
  }

  if (resourceId === "login") {
    if (request.method !== "POST") {
      throw methodNotAllowed(request.method);
    }

    const result = await context.controllers.auth.login({
      ...createRequestContext(request, url, user),
      body: requestBody
    });
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  if (resourceId !== "me") {
    return false;
  }

  if (request.method !== "GET") {
    throw methodNotAllowed(request.method);
  }

  requireActiveUser(user);
  const result = await context.controllers.auth.getMe(createRequestContext(request, url, user));
  sendJson(response, result.statusCode, result.body);
  return true;
}
