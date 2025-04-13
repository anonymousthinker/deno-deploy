import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { createApp } from "./server.js";

describe("test server", () => {
  it('should respond with "Working Fine!" when requested with /test', async () => {
    const app = createApp();
    const response = await app.request("http://localhost:8000/test");
    assertEquals(await response.text(), "Working Fine!");
  });
});
