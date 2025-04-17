import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";
import { cors } from "https://deno.land/x/hono@v3.12.11/middleware.ts";

const kv = await Deno.openKv();

const handlePolling = async () => {
  const res = await kv.get(["events"]);
  if (res.value) {
    return {
      status: res.value.status,
      commit: res.value.display_title,
      author: res.value.actor.login,
    };
  }
  return {};
};

const staticRoutes = () => {
  const app = new Hono();

  app.get("*", serveStatic({ root: "./" }));

  app.get("/test", (c) => {
    return c.text("Working Fine!");
  });

  app.get("/books", async (c) => {
    const iter = kv.list({ prefix: ["books"] });
    const books = [];
    for await (const res of iter) {
      books.push(res.value);
    }

    return c.json(books);
  });

  return app;
};

const authenticatedRoutes = () => {
  const app = new Hono();

  app.post("/post-event", async (c) => {
    const body = await c.req.json();
    const response = await kv.set(["events"], body.workflow_run);
    return c.json(response);
  });

  app.post("/poll-status", async (c) => {
    return c.json(await handlePolling());
  });

  app.post("/add-book", async (c) => {
    const body = await c.req.json();
    const response = await kv.set(["books", body.title], body);
    return c.json(response);
  });

  app.delete("/delete-book", async (c) => {
    const title = await c.req.formData();
    await kv.delete(["books", title.get("title")]);
    return c.text("deleted");
  });

  return app;
};

export const createApp = () => {
  const serveStaticRoutes = staticRoutes();
  const serveAuthenticatedRoutes = authenticatedRoutes();

  const app = new Hono();

  app.use(logger());
  app.use("/*", cors());
  app.route("/", serveStaticRoutes);
  app.route("/", serveAuthenticatedRoutes);

  return app;
};

Deno.serve(createApp().fetch);
