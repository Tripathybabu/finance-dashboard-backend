export async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  try {
    const parsed = JSON.parse(rawBody);

    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      const error = new Error("Request body must be a JSON object.");
      error.statusCode = 400;
      throw error;
    }

    return parsed;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const parseError = new Error("Request body must be valid JSON.");
    parseError.statusCode = 400;
    throw parseError;
  }
}
