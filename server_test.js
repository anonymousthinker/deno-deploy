import { assertEquals } from "jsr:@std/assert";
import { createApp } from "./server.js";

Deno.test({
  name: "test /test",
  fn: async () => {
    const app = createApp();
    const response = await app.request("http://localhost:8000/test");
    assertEquals(await response.text(), "Working Fine!");
  },
});

Deno.test({
  name: "test for /add-book",
  fn: async () => {
    const app = createApp();
    const book = { title: "Pirates", author: "Eichiro Oda", stock: 150 };
    const response = await app.request("http://localhost:8000/add-book", {
      method: "post",
      body: JSON.stringify(book),
    });
    const res = await response.json();
    assertEquals(res.ok, true);
  },
});

Deno.test({
  name: "test for /books",
  fn: async () => {
    const app = createApp();
    const response = await app.request("http://localhost:8000/books");
    assertEquals(await response.json(), [
      {
        author: "Eichiro Oda",
        stock: 150,
        title: "Pirates",
      },
    ]);
  },
});

Deno.test({
  name: "test for /delete-book",
  fn: async () => {
    const app = createApp();
    const fd = new FormData();
    fd.set("title", "Pirates");
    const response = await app.request("http://localhost:8000/delete-book", {
      method: "delete",
      body: fd,
    });
    assertEquals(await response.text(), "deleted");
  },
});

Deno.test({
  name: "test for /books",
  fn: async () => {
    const app = createApp();
    const response = await app.request("http://localhost:8000/books");
    assertEquals(await response.json(), []);
  },
});

Deno.test({
  name: "test for /",
  fn: async () => {
    const app = createApp();
    const response = await app.request("http://localhost:8000/");
    assertEquals(response.status, 302);
    assertEquals(response.headers.get("location"), "/books");
  },
});
