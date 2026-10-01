# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** The scaffold copied fields without substantive runtime validation and lacked a metadata boundary. Emitted ESM paths also needed correction for a normal Node start.

**After:** Zod validates create and partial updates. Metadata accepts configured exact HTTPS hosts on port 443, validates public IPv4 DNS answers, pins the connection, rejects redirects, and bounds headers/body/time. The UI applies a proposed title only if its URL still matches the request.

## Predict this example

A controlled host returns title A &amp; B, yielding A & B. A redirect to loopback is rejected without contacting its target. Private DNS, unlisted hosts, oversized bodies and timeouts fail. DNS finishing after timeout cannot start a transfer. A javascript: URL is rejected before insertion.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The excerpt below comes from [server/src/services/metadata.ts](../server/src/services/metadata.ts) near line 63. It is a teaching snapshot; the linked source is authoritative if you later edit the project. Read surrounding code for callers and setup.

```typescript
export async function fetchMetadata(input: unknown, options: MetadataOptions = {}) {
  const url = new URL(bookmarkUrl(input));
  const allowed = options.allowedHosts ?? (process.env.BOOKMARK_METADATA_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (url.protocol !== "https:" || (url.port && url.port !== "443") || isIP(url.hostname) || url.hostname.includes(":") || !allowed.includes(url.hostname.toLowerCase())) throw new ValidationError("Metadata is enabled only for explicitly configured HTTPS hostnames on port 443. Enter a title manually for other links.");
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 5000, maxBytes = options.maxBytes ?? 65536;
  let timer: ReturnType<typeof setTimeout>;
  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new ValidationError("Metadata request timed out.")); }, timeoutMs);
  });
  try {
    return await Promise.race([expired, (async () => {
      const addresses = await (options.resolve ?? resolve4)(url.hostname);
      if (controller.signal.aborted) throw new ValidationError("Metadata request timed out.");
      if (!addresses.length || addresses.some((address) => !isPublicIPv4(address))) throw new ValidationError("Metadata destination must resolve exclusively to public IPv4 addresses.");
      const html = await (options.transfer ?? requestHtml)(url, addresses[0], { signal: controller.signal, maxBytes });
      if (Buffer.byteLength(html, "utf8") > maxBytes) throw new ValidationError("Metadata response is too large.");
      const raw = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html)?.[1] || url.hostname;
      const title = raw.replace(/<[^>]*>/g, "").replace(/&(amp|lt|gt|quot|apos);/g, (_match, key: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[key] || "")).replace(/\s+/g, " ").trim().slice(0,255);
      return { url: url.href, title: title || url.hostname };
    })()]);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Could not fetch page metadata. Enter a title manually.");
  } finally { clearTimeout(timer!); controller.abort(); }
}
```

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

Saving URL text and fetching it are distinct permission boundaries. The empty-by-default BOOKMARK_METADATA_HOSTS allowlist prevents ambient requests during ordinary saves. An allowed name can still resolve to a private address: validate its DNS answers, then pin a checked address into the real connection lookup while retaining the hostname for TLS verification. Otherwise a second DNS decision could differ from the checked result. Rejecting every redirect avoids a new unchecked target. One deadline covers DNS and response work, and delayed DNS checks the abort state before starting transport. The conservative policy supports only public IPv4 HTTPS and uncompressed HTML; it is not a universal website scraper. Tests substitute the connection factory to reach a local stub while retaining real response-status, size and timeout handling. No external website was contacted for verification.

## Three variations to work through

- **Normal variation — a partial edit.** `PUT /api/bookmarks/:id` with `{ "status": "archived" }`. Predict 200, `status` changed, `tags` and `url` untouched. Then `{ "tags": ["a", "A"] }`: predict the stored value after de-duplication.

- **Invalid variation — a dangerous URL.** `POST` with `url: "javascript:alert(1)"`, then with `https://user:password@example.com`. Predict two 400s with the Zod path in the message and no rows. Then `GET /api/bookmarks?search=%`: predict every row (before the fix pass) versus only titles containing a literal `%` (now).

- **Boundary variation — a denied metadata host.** With `BOOKMARK_METADATA_HOSTS` empty, request metadata for a saved bookmark. Predict the 4xx and that the record is unchanged (first test). Then allow `localhost` and point it at the local stub from the metadata tests.

## Executable examples

These are the actual regression tests in [server/test/metadata.test.ts](../server/test/metadata.test.ts). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

```typescript
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
```

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
