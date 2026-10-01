import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type https from "node:https";
import {
  fetchMetadata,
  createHtmlTransfer,
  isPublicIPv4,
} from "../src/services/metadata.js";
test("public-address policy rejects loopback, private, mapped IPv6 and reserved ranges", () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "192.0.2.1",
    "198.18.0.1",
    "198.51.100.1",
    "203.0.113.1",
    "224.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(isPublicIPv4(ip), false, ip);
  assert.equal(isPublicIPv4("93.184.216.34"), true);
});
test("real controlled HTTP responses exercise redirects, body caps and timeout without external requests", async (t) => {
  const hits: string[] = [];
  const lookups: string[] = [];
  const server = http.createServer((req, res) => {
    hits.push(req.url || "");
    if (req.url === "/redirect") {
      res.writeHead(302, { Location: "http://127.0.0.1/protected" });
      res.end();
      return;
    }
    if (req.url === "/slow") return;
    res.setHeader("Content-Type", "text/html");
    if (req.url === "/large") {
      res.write("x".repeat(100));
      res.end("x".repeat(100));
      return;
    }
    res.end("<html><title>A &amp; B</title></html>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  const port = (server.address() as any).port;
  // Only the connection factory is substituted. Production response handling is unchanged.
  const get = ((url: URL, options: any, callback: any) => {
    options.lookup(url.hostname, {}, (error: Error | null, address: string) => {
      assert.equal(error, null);
      lookups.push(address);
    });
    return http.get(
      {
        hostname: "127.0.0.1",
        port,
        path: url.pathname,
        signal: options.signal,
      },
      callback,
    );
  }) as typeof https.get;
  const options = {
    allowedHosts: ["allowed.example"],
    resolve: async () => ["93.184.216.34"],
    transfer: createHtmlTransfer(get),
    timeoutMs: 1000,
    maxBytes: 128,
  };
  assert.deepEqual(await fetchMetadata("https://allowed.example/ok", options), {
    url: "https://allowed.example/ok",
    title: "A & B",
  });
  await assert.rejects(
    fetchMetadata("https://allowed.example/redirect", options),
    /redirects/,
  );
  await assert.rejects(
    fetchMetadata("https://allowed.example/large", options),
    /too large/,
  );
  await assert.rejects(
    fetchMetadata("https://allowed.example/slow", {
      ...options,
      timeoutMs: 100,
    }),
    /timed out|Could not fetch/,
  );
  const before = hits.length;
  await assert.rejects(
    fetchMetadata("https://allowed.example/private", {
      ...options,
      resolve: async () => ["127.0.0.1"],
    }),
    /public IPv4/,
  );
  await assert.rejects(
    fetchMetadata("https://unlisted.example/", options),
    /configured/,
  );
  await assert.rejects(
    fetchMetadata("https://127.0.0.1/", options),
    /configured/,
  );
  assert.equal(hits.length, before);
  assert.equal(hits.includes("/protected"), false);
  assert.ok(lookups.every((ip) => ip === "93.184.216.34"));
});
test("DNS completing after timeout cannot start a transfer", async () => {
  let transferCalls = 0;
  await assert.rejects(
    fetchMetadata("https://allowed.example/", {
      allowedHosts: ["allowed.example"],
      timeoutMs: 10,
      resolve: () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(["93.184.216.34"]), 50),
        ),
      transfer: async () => {
        transferCalls++;
        return "<title>Never</title>";
      },
    }),
    /timed out/,
  );
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(transferCalls, 0);
});
