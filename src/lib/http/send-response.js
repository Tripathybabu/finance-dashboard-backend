export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload, null, 2));
}

export function sendError(response, statusCode, message, details) {
  sendJson(response, statusCode, {
    error: {
      message,
      details: details || null
    }
  });
}
