import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ============ Health check ============
app.get("/make-server-ef957755/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ Load full accounting state ============
app.get("/make-server-ef957755/accounting/state", async (c) => {
  try {
    const state = await kv.get("accounting_state");
    if (!state) {
      return c.json({ data: null, message: "No saved state found" });
    }
    return c.json({ data: state });
  } catch (error) {
    console.log(`Error loading accounting state: ${error}`);
    return c.json({ error: `Failed to load state: ${error}` }, 500);
  }
});

// ============ Save full accounting state ============
app.post("/make-server-ef957755/accounting/state", async (c) => {
  try {
    const body = await c.req.json();
    if (!body || !body.state) {
      return c.json({ error: "Missing state in request body" }, 400);
    }
    await kv.set("accounting_state", body.state);
    return c.json({ success: true, message: "State saved successfully" });
  } catch (error) {
    console.log(`Error saving accounting state: ${error}`);
    return c.json({ error: `Failed to save state: ${error}` }, 500);
  }
});

// ============ Reset state (delete saved data) ============
app.delete("/make-server-ef957755/accounting/state", async (c) => {
  try {
    await kv.del("accounting_state");
    return c.json({ success: true, message: "State reset successfully" });
  } catch (error) {
    console.log(`Error resetting accounting state: ${error}`);
    return c.json({ error: `Failed to reset state: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
