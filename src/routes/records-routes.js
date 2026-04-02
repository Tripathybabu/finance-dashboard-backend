import { sendJson } from "../lib/http/send-response.js";
import { requireRole } from "../middleware/auth.js";
import { createRequestContext, methodNotAllowed } from "./helpers.js";

export async function handleRecordRoutes(request, response, context, url, segments, user, requestBody) {
  const [, resource, resourceId] = segments;

  if (resource !== "records") {
    return false;
  }

  if (segments.length === 2) {
    if (request.method === "GET") {
      requireRole(user, ["admin", "analyst"]);
      const result = await context.controllers.records.listRecords(
        createRequestContext(request, url, user)
      );
      sendJson(response, result.statusCode, result.body);
      return true;
    }

    if (request.method === "POST") {
      requireRole(user, ["admin"]);
      const result = await context.controllers.records.createRecord({
        ...createRequestContext(request, url, user),
        body: requestBody
      });
      sendJson(response, result.statusCode, result.body);
      return true;
    }

    throw methodNotAllowed(request.method);
  }

  if (segments.length === 3) {
    const requestContext = createRequestContext(request, url, user, { recordId: resourceId });

    if (request.method === "GET") {
      requireRole(user, ["admin", "analyst"]);
      const result = await context.controllers.records.getRecord(requestContext);
      sendJson(response, result.statusCode, result.body);
      return true;
    }

    if (request.method === "PATCH") {
      requireRole(user, ["admin"]);
      const result = await context.controllers.records.updateRecord({
        ...requestContext,
        body: requestBody
      });
      sendJson(response, result.statusCode, result.body);
      return true;
    }

    if (request.method === "DELETE") {
      requireRole(user, ["admin"]);
      const result = await context.controllers.records.deleteRecord(requestContext);
      sendJson(response, result.statusCode, result.body);
      return true;
    }

    throw methodNotAllowed(request.method);
  }

  return false;
}
