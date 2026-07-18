/** Replaces {{variable}} tokens while leaving unresolved tokens visible. */
export function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] ?? match);
}

/** Interpolates all enabled key-value entries for headers or params. */
export function interpolatePairs(pairs: KeyValuePair[] = [], variables: Record<string, string>): KeyValuePair[] {
  return pairs.map((pair) => ({ ...pair, key: interpolate(pair.key, variables), value: interpolate(pair.value, variables) }));
}

export interface KeyValuePair {
  key: string;
  value: string;
  enabled?: boolean;
}
