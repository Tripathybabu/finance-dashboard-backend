import http from "node:http";
import { createAppContext } from "./create-app-context.js";
import { handleRequest } from "../routes/index.js";

export async function createApp(options = {}) {
  const context = await createAppContext(options);

  return {
    context,
    listen(port, callback) {
      const server = http.createServer((request, response) => {
        handleRequest(request, response, context);
      });

      return server.listen(port, callback);
    },
    async close() {
      await context.close();
    }
  };
}
