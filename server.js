import { Hono } from "hono";
import { serveStatic } from "hono/deno";

let event = {};
const kv = await Deno.openKv();

const handlePolling = () => {
  return {
    status: event.status,
    commit: event.display_title,
    author: event.actor.login,
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
    event = body.workflow_run;
    return c.text("done");
  });

  app.post("/poll-status", (c) => {
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

  app.route("/", serveStaticRoutes);
  app.route("/", serveAuthenticatedRoutes);

  return app;
};

Deno.serve(createApp().fetch);
