import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { checkoutApi } from "./checkout";
import { opsApp, storefrontData } from "./ops";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  process.loadEnvFile();
} catch {
  /* no .env file — rely on real environment variables */
}

async function startServer() {
  const app = express();
  // Render sits in front of the app; trust its forwarded address and https.
  app.set("trust proxy", 1);
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // Health check for the host (Render pings this to know the service is up).
  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(checkoutApi(path.join(staticPath, "data", "ops-products.json")));
  // Nail'd Ops at /ops (password protected) and the products it publishes.
  app.use(opsApp(path.resolve(__dirname, "..", "ops-app")));
  app.use(storefrontData());
  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
