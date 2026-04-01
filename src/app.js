import http from "node:http";
import { handleRequest } from "./http/router.js";
import { createAppContext } from "./context.js";

export function createApp(options = {}) {
  const context = createAppContext(options);

  return {
    context,
    listen(port, callback) {
      const server = http.createServer((request, response) => {
        handleRequest(request, response, context);
      });

      return server.listen(port, callback);
    }
  };
}
