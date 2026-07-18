/** Replaces {{variable}} tokens for local previews while keeping unresolved tokens visible. */
export function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] ?? match);
}

/** Converts active environment variables into an interpolation map. */
export function variableMap(variables: Array<{ key: string; value: string }>): Record<string, string> {
  return Object.fromEntries(variables.map((variable) => [variable.key, variable.value]));
}
