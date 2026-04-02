import { readJsonBody } from "../lib/http/read-json-body.js";
import { createOpenApiSpec, getSwaggerHtml } from "../docs/openapi.js";
import { sendError, sendJson } from "../lib/http/send-response.js";
import { authenticate } from "../middleware/auth.js";
import { handleAuthRoutes } from "./auth-routes.js";
import { handleDashboardRoutes } from "./dashboard-routes.js";
import { getPathSegments, notFoundError, parseUrl } from "./helpers.js";
import { handleRecordRoutes } from "./records-routes.js";
import { handleUserRoutes } from "./users-routes.js";

function withCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
}

async function maybeReadBody(request) {
  return ["POST", "PATCH", "PUT"].includes(request.method) ? readJsonBody(request) : {};
}

async function dispatchApiRequest(request, response, context, url, segments, user) {
  const requestBody = await maybeReadBody(request);

  if (await handleUserRoutes(request, response, context, url, segments, user, requestBody)) {
    return;
  }

  if (await handleAuthRoutes(request, response, context, url, segments, user, requestBody)) {
    return;
  }

  if (await handleRecordRoutes(request, response, context, url, segments, user, requestBody)) {
    return;
  }

  if (await handleDashboardRoutes(request, response, context, url, segments, user)) {
    return;
  }

  throw notFoundError();
}

export async function handleRequest(request, response, context) {
  withCors(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    const url = parseUrl(request);
    const segments = getPathSegments(url);

    if (segments.length === 1 && segments[0] === "health") {
      sendJson(response, 200, {
        status: "ok",
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (request.method === "GET" && segments.length === 1 && segments[0] === "swagger.json") {
      sendJson(response, 200, createOpenApiSpec());
      return;
    }

    if (request.method === "GET" && segments.length === 1 && segments[0] === "docs") {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });
      response.end(getSwaggerHtml());
      return;
    }

    const user = await authenticate(request, context);

    if (segments[0] !== "api") {
      throw notFoundError();
    }

    await dispatchApiRequest(request, response, context, url, segments, user);
  } catch (error) {
    sendError(
      response,
      error.statusCode || 500,
      error.message || "Internal server error.",
      error.details || null
    );
  }
}
