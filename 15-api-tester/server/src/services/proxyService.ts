import axios from "axios";
import { env } from "../config/env";
import * as environmentModel from "../models/environmentModel";
import * as historyModel from "../models/historyModel";
import { interpolate, interpolatePairs, type KeyValuePair } from "../utils/interpolate";

export interface ProxyRequestInput {
  method: string;
  url: string;
  params?: KeyValuePair[];
  headers?: KeyValuePair[];
  body?: string;
  environmentId?: number;
  auth?: { type: "none" | "bearer" | "basic"; token?: string; username?: string; password?: string };
}

/** Converts enabled key-value pairs into an object accepted by axios. */
function pairsToObject(pairs: KeyValuePair[] = []): Record<string, string> {
  return pairs.filter((pair) => pair.enabled !== false && pair.key).reduce<Record<string, string>>((output, pair) => ({ ...output, [pair.key]: pair.value }), {});
}

/** Applies auth settings to headers in the same place the proxy normalizes input. */
function applyAuth(headers: Record<string, string>, auth?: ProxyRequestInput["auth"]): Record<string, string> {
  if (!auth || auth.type === "none") return headers;
  if (auth.type === "bearer" && auth.token) return { ...headers, Authorization: `Bearer ${auth.token}` };
  if (auth.type === "basic" && auth.username) {
    return { ...headers, Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password ?? ""}`).toString("base64")}` };
  }
  return headers;
}

/** Interpolates auth fields so bearer tokens can use environment variables. */
function interpolateAuth(auth: ProxyRequestInput["auth"], variables: Record<string, string>): ProxyRequestInput["auth"] {
  if (!auth) return auth;
  return {
    ...auth,
    token: auth.token ? interpolate(auth.token, variables) : auth.token,
    username: auth.username ? interpolate(auth.username, variables) : auth.username,
    password: auth.password ? interpolate(auth.password, variables) : auth.password
  };
}

/** Sends a request through the backend proxy, measures timing, and records history. */
export async function sendProxyRequest(userId: number, input: ProxyRequestInput) {
  const variables = await environmentModel.getVariableMap(userId, input.environmentId);
  const interpolatedParams = interpolatePairs(input.params ?? [], variables);
  const interpolatedHeaders = interpolatePairs(input.headers ?? [], variables);
  const url = interpolate(input.url, variables);
  const body = input.body ? interpolate(input.body, variables) : undefined;
  const headers = applyAuth(pairsToObject(interpolatedHeaders), interpolateAuth(input.auth, variables));
  const params = pairsToObject(interpolatedParams);
  const startedAt = performance.now();

  try {
    const response = await axios.request({
      method: input.method,
      url,
      params,
      headers,
      data: body,
      timeout: env.proxyTimeoutMs,
      validateStatus: () => true
    });
    const totalMs = Math.round(performance.now() - startedAt);
    const responseBody = typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2);
    const responseSizeBytes = Buffer.byteLength(responseBody);
    await historyModel.createHistory(userId, {
      method: input.method,
      url: response.config.url ?? url,
      request_headers: headers,
      request_body: body,
      response_status: response.status,
      response_headers: response.headers,
      response_body: responseBody,
      response_size_bytes: responseSizeBytes,
      response_time_ms: totalMs
    });
    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: responseBody,
      sizeBytes: responseSizeBytes,
      timing: { totalMs }
    };
  } catch (error) {
    const totalMs = Math.round(performance.now() - startedAt);
    const message = error instanceof Error ? error.message : "Request failed";
    await historyModel.createHistory(userId, {
      method: input.method,
      url,
      request_headers: headers,
      request_body: body,
      response_time_ms: totalMs,
      error_message: message
    });
    return { status: 0, statusText: "Network Error", headers: {}, body: message, sizeBytes: message.length, timing: { totalMs }, error: message };
  }
}
