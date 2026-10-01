import https from "node:https";
import { resolve4 } from "node:dns/promises";
import { isIP } from "node:net";
import { ValidationError } from "../utils/errors.js";

export function bookmarkUrl(value: unknown): string {
  if (typeof value !== "string" || value.length > 255) throw new ValidationError("URL must be text up to 255 characters.");
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new ValidationError("Use an absolute http or https URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.href.length > 255) throw new ValidationError("Use an http or https URL without credentials, up to 255 characters.");
  return url.href;
}

/** Conservative IPv4-only metadata policy. Saving a URL does not fetch it. */
export function isPublicIPv4(address: string): boolean {
  if (isIP(address) !== 4) return false;
  const [a,b,c] = address.split(".").map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}
interface TransferOptions { signal: AbortSignal; maxBytes: number }
type Transfer = (url: URL, address: string, options: TransferOptions) => Promise<string>;
interface MetadataOptions {
  allowedHosts?: string[];
  resolve?: (hostname: string) => Promise<string[]>;
  transfer?: Transfer;
  timeoutMs?: number;
  maxBytes?: number;
}

/** No redirect following. DNS is pinned to a checked address for the connection. */
export function createHtmlTransfer(get: typeof https.get = https.get): Transfer {
return (url, address, { signal, maxBytes }) => new Promise((resolve, reject) => {
  const request = get(url, {
    signal,
    family: 4,
    lookup: ((_hostname: string, _options: unknown, callback: Function) => callback(null, address, 4)) as any,
    headers: { Accept: "text/html", "Accept-Encoding": "identity", "User-Agent": "BookmarkLearningApp/1.0" },
    maxHeaderSize: 16384,
  }, (response) => {
    const fail = (message: string) => { response.destroy(); request.destroy(); reject(new ValidationError(message)); };
    if (response.statusCode !== 200) return fail("Metadata requires a direct 200 response; redirects are not followed.");
    if (!/^text\/html(?:;|$)/i.test(String(response.headers["content-type"] || ""))) return fail("Metadata requires an HTML response.");
    if (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity") return fail("Compressed metadata responses are not supported.");
    if (Number(response.headers["content-length"]) > maxBytes) return fail("Metadata response is too large.");
    const chunks: Buffer[] = []; let bytes = 0;
    response.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > maxBytes) return fail("Metadata response is too large.");
      chunks.push(chunk);
    });
    response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    response.on("error", reject);
  });
  request.on("error", reject);
});
}
export const requestHtml = createHtmlTransfer();

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
