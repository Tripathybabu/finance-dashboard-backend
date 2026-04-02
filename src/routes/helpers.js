export function parseUrl(request) {
  return new URL(request.url, "http://localhost");
}

export function getPathSegments(url) {
  return url.pathname.split("/").filter(Boolean);
}

export function getQuery(url) {
  return Object.fromEntries(url.searchParams.entries());
}

export function createRequestContext(request, url, user, params = {}) {
  return {
    request,
    user,
    params,
    query: getQuery(url)
  };
}

export function notFoundError() {
  const error = new Error("The requested resource was not found.");
  error.statusCode = 404;
  return error;
}

export function methodNotAllowed(method) {
  const error = new Error(`Method ${method} is not allowed on this endpoint.`);
  error.statusCode = 405;
  return error;
}
