import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";

const event = new Map();
const kv = await Deno.openKv();

const handlePolling = () => {
  if (event.size !== 0)
    return {
      status: event.get("workflow-event").status,
      commit: event.get("workflow-event").display_title,
      author: event.get("workflow-event").actor.login,
    };
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
    event.set("workflow-event", body.workflow_run);
    return c.text("done");
  });

  app.post("/poll-status", (c) => {
    console.log("event", event);
    return c.json(handlePolling());
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
  app.route("/", serveStaticRoutes);
  app.route("/", serveAuthenticatedRoutes);

  return app;
};

Deno.serve(createApp().fetch);
