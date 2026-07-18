import { db } from "../config/db";

/** Lists environments with their variables for the current user. */
export async function listEnvironments(userId: number) {
  const environments = await db("environments").where({ user_id: userId }).orderBy("name", "asc");
  const variables = await db("env_variables").whereIn("environment_id", environments.map((env) => env.id)).orderBy("sort_order", "asc");
  return environments.map((environment) => ({
    ...environment,
    variables: variables.filter((variable) => variable.environment_id === environment.id)
  }));
}

/** Creates an environment for the current user. */
export async function createEnvironment(userId: number, values: Record<string, unknown>) {
  const [environment] = await db("environments").insert({ ...values, user_id: userId }).returning("*");
  return environment;
}

/** Updates environment metadata. */
export async function updateEnvironment(id: number, userId: number, values: Record<string, unknown>) {
  const [environment] = await db("environments").where({ id, user_id: userId }).update({ ...values, updated_at: db.fn.now() }).returning("*");
  return environment;
}

/** Deletes an environment owned by the user. */
export async function deleteEnvironment(id: number, userId: number) {
  return db("environments").where({ id, user_id: userId }).delete();
}

/** Marks one environment active after clearing the user's previous active flag. */
export async function activateEnvironment(id: number, userId: number) {
  return db.transaction(async (trx) => {
    await trx("environments").where({ user_id: userId }).update({ is_active: false });
    const [environment] = await trx("environments").where({ id, user_id: userId }).update({ is_active: true, updated_at: trx.fn.now() }).returning("*");
    return environment;
  });
}

/** Replaces all variables for one environment. */
export async function replaceVariables(environmentId: number, userId: number, variables: Array<Record<string, unknown>>) {
  return db.transaction(async (trx) => {
    const environment = await trx("environments").where({ id: environmentId, user_id: userId }).first();
    if (!environment) return null;
    await trx("env_variables").where({ environment_id: environmentId }).delete();
    if (!variables.length) return [];
    return trx("env_variables").insert(variables.map((variable, index) => ({ ...variable, environment_id: environmentId, sort_order: index }))).returning("*");
  });
}

/** Gets variables for a specific environment. */
export async function getVariables(environmentId: number, userId: number) {
  const environment = await db("environments").where({ id: environmentId, user_id: userId }).first();
  if (!environment) return null;
  return db("env_variables").where({ environment_id: environmentId }).orderBy("sort_order", "asc");
}

/** Builds the interpolation dictionary from an explicit or active environment. */
export async function getVariableMap(userId: number, environmentId?: number): Promise<Record<string, string>> {
  const environment = environmentId
    ? await db("environments").where({ id: environmentId, user_id: userId }).first()
    : await db("environments").where({ user_id: userId, is_active: true }).first();
  if (!environment) return {};
  const variables = await db("env_variables").where({ environment_id: environment.id });
  return Object.fromEntries(variables.map((variable) => [variable.key, variable.value]));
}
