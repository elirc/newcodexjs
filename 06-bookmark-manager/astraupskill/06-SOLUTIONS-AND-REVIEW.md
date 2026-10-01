# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Check a solution the same way the course checks its own

Every solution below should survive the same request chapter 03 runs; send it after your change and compare the response to the expected observations in chapter 03:

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

## Existing implementation

Zod validates create and partial updates. Metadata accepts configured exact HTTPS hosts on port 443, validates public IPv4 DNS answers, pins the connection, rejects redirects, and bounds headers/body/time. The UI applies a proposed title only if its URL still matches the request.

The key model is: Bookmarks store title, URL, collection, status and JSON tags. Saving a URL never fetches it. Explicit metadata preview proposes a title and URL without saving a bookmark.

The worked fixture should behave as follows: A controlled host returns title A &amp; B, yielding A & B. A redirect to loopback is rejected without contacting its target. Private DNS, unlisted hosts, oversized bodies and timeouts fail. DNS finishing after timeout cannot start a transfer. A javascript: URL is rejected before insertion.

## Extension solutions

### Exercise 1

**Prompt:** Explain disabled metadata capability before requesting.

**Approach:** Expose a capability flag without secrets and retain manual entry in every state.

**Review:** the capability flag must come from a server endpoint that reports whether any host is allowed (never the host list itself), the button must be disabled with an explanation when it is false, and manual entry must work in every state; assert both states in a client test.

### Exercise 2

**Prompt:** Improve bounded title entity decoding.

**Approach:** Use a parser that neither executes scripts nor fetches resources; bound input first and render output as text.

**Review:** the decoder must handle the named and numeric entities the tests list without executing anything (no `innerHTML`, no DOM parser that fetches), must cap input length before decoding, and must be tested against a title with nested entities and one that exceeds the cap.

### Exercise 3

**Prompt:** Test mixed DNS answers and forbidden ports.

**Approach:** Return public and private answers together and assert no transfer. Test non-443 ports and credentials separately.

**Review:** the mixed-DNS test must return one public and one private address for the same name and assert no transfer starts; the port test must reject `https://host:8443` and `http://host:80` for the allow-listed host; explain which check runs first.

### Exercise 4

**Prompt:** Design safe redirect support.

**Approach:** Limit hops, revalidate and pin every target, retain one deadline/byte budget and forward no credentials. Keep redirects rejected until those cases are verified.

**Review:** the redirect design must revalidate the target host against the allow-list on every hop, cap hops, keep one deadline and byte budget across hops, and never forward `Authorization` or cookies; the write-up must say why redirects stay rejected until all four hold.

### Exercise 7 — ownership and authorization

Reference: `listRecords(query)` gains `.where("owner", query.owner)` *before* the search group so the `ILIKE` predicates are scoped; `findRecord(id, owner)` becomes `.where({ id, owner }).first()`.

Review: the owner filter and the search group must combine with AND (put the search predicates inside one `where(function () { ... })` as the model already does), otherwise `orWhereRaw` would escape the owner scope; write the failing test first to see that mistake.

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [server/test/metadata.test.ts](../server/test/metadata.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: The scaffold copied fields without substantive runtime validation and lacked a metadata boundary. Emitted ESM paths also needed correction for a normal Node start. I changed the implementation so that: Zod validates create and partial updates. Metadata accepts configured exact HTTPS hosts on port 443, validates public IPv4 DNS answers, pins the connection, rejects redirects, and bounds headers/body/time. The UI applies a proposed title only if its URL still matches the request. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
