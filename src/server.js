import { createApp } from "./app/create-app.js";

const port = Number(process.env.PORT || 3000);
const app = await createApp();
const server = app.listen(port, () => {
  console.log(`Finance dashboard backend listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await app.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
