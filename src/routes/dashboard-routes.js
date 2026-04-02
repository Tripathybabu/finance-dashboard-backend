import { sendJson } from "../lib/http/send-response.js";
import { requireRole } from "../middleware/auth.js";
import { createRequestContext, methodNotAllowed } from "./helpers.js";

export async function handleDashboardRoutes(request, response, context, url, segments, user) {
  const [, resource, resourceId] = segments;

  if (resource !== "dashboard" || segments.length !== 3) {
    return false;
  }

  requireRole(user, ["admin", "analyst", "viewer"]);

  if (request.method !== "GET") {
    throw methodNotAllowed(request.method);
  }

  if (resourceId === "summary") {
    const result = await context.controllers.dashboard.getSummary(
      createRequestContext(request, url, user)
    );
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  if (resourceId === "trends") {
    const result = await context.controllers.dashboard.getTrends(
      createRequestContext(request, url, user)
    );
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  if (resourceId === "recent-activity") {
    const result = await context.controllers.dashboard.getRecentActivity(
      createRequestContext(request, url, user)
    );
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  return false;
}
