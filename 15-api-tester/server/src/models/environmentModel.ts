import { NotFoundError, ValidationError } from "../utils/errors.js";
import { db } from "../config/db.js";

/** Lists environments with their variables for the current user. */
export async function listEnvironments(userId: number) {
  const environments = await db("environments")
    .where({ user_id: userId })
    .orderBy("name", "asc");
  const variables = await db("env_variables")
    .whereIn(
      "environment_id",
      environments.map((env) => env.id),
    )
    .orderBy("sort_order", "asc");
  return environments.map((environment) => ({
    ...environment,
    variables: variables.filter(
      (variable) => variable.environment_id === environment.id,
    ),
  }));
}

/** Creates an environment for the current user. */
export async function createEnvironment(
  userId: number,
  values: Record<string, unknown>,
) {
  return db.transaction(async (trx) => {
    await trx("users").where({ id: userId }).forUpdate().first();
    if (values.is_active)
      await trx("environments")
        .where({ user_id: userId })
        .update({ is_active: false });
    return (
      await trx("environments")
        .insert({ ...values, user_id: userId })
        .returning("*")
    )[0];
  });
}

/** Updates metadata while preserving one active environment per user. */
export async function updateEnvironment(
  id: number,
  userId: number,
  values: Record<string, unknown>,
) {
  return db.transaction(async (trx) => {
    await trx("users").where({ id: userId }).forUpdate().first();
    const target = await trx("environments")
      .where({ id, user_id: userId })
      .first();
    if (!target) throw new NotFoundError("Environment not found");
    if (values.is_active)
      await trx("environments")
        .where({ user_id: userId })
        .update({ is_active: false });
    return (
      await trx("environments")
        .where({ id, user_id: userId })
        .update({ ...values, updated_at: trx.fn.now() })
        .returning("*")
    )[0];
  });
}

/** Deletes an environment owned by the user. */
export async function deleteEnvironment(id: number, userId: number) {
  return db("environments").where({ id, user_id: userId }).delete();
}

/** Marks one environment active after clearing the user's previous active flag. */
export async function activateEnvironment(id: number, userId: number) {
  return db.transaction(async (trx) => {
    await trx("users").where({ id: userId }).forUpdate().first();
    const target = await trx("environments")
      .where({ id, user_id: userId })
      .first();
    if (!target) throw new NotFoundError("Environment not found");
    await trx("environments")
      .where({ user_id: userId })
      .update({ is_active: false });
    const [environment] = await trx("environments")
      .where({ id, user_id: userId })
      .update({ is_active: true, updated_at: trx.fn.now() })
      .returning("*");
    return environment;
  });
}

/** Replaces all variables for one environment. */
export async function replaceVariables(
  environmentId: number,
  userId: number,
  variables: Array<Record<string, unknown>>,
) {
  return db.transaction(async (trx) => {
    const environment = await trx("environments")
      .where({ id: environmentId, user_id: userId })
      .forUpdate()
      .first();
    if (!environment) return null;
    const keys = variables.map((v) => String(v.key).trim());
    if (new Set(keys).size !== keys.length)
      throw new ValidationError("Variable keys must be unique");
    await trx("env_variables")
      .where({ environment_id: environmentId })
      .delete();
    if (!variables.length) return [];
    return trx("env_variables")
      .insert(
        variables.map((variable, index) => ({
          ...variable,
          key: keys[index],
          environment_id: environmentId,
          sort_order: index,
        })),
      )
      .returning("*");
  });
}

/** Gets variables for a specific environment. */
export async function getVariables(environmentId: number, userId: number) {
  const environment = await db("environments")
    .where({ id: environmentId, user_id: userId })
    .first();
  if (!environment) return null;
  return db("env_variables")
    .where({ environment_id: environmentId })
    .orderBy("sort_order", "asc");
}

/** Builds the interpolation dictionary from an explicit or active environment. */
export async function getVariableMap(
  userId: number,
  environmentId?: number,
): Promise<Record<string, string>> {
  const environment = environmentId
    ? await db("environments")
        .where({ id: environmentId, user_id: userId })
        .first()
    : await db("environments")
        .where({ user_id: userId, is_active: true })
        .first();
  if (!environment) return {};
  const variables = await db("env_variables").where({
    environment_id: environment.id,
  });
  return Object.fromEntries(
    variables.map((variable) => [variable.key, variable.value]),
  );
}
