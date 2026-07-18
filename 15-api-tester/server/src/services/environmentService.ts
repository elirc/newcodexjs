import * as environmentModel from "../models/environmentModel";
import { NotFoundError } from "../utils/errors";

/** Lists environments with variables. */
export async function listEnvironments(userId: number) {
  return environmentModel.listEnvironments(userId);
}

/** Creates an environment. */
export async function createEnvironment(userId: number, values: Record<string, unknown>) {
  return environmentModel.createEnvironment(userId, values);
}

/** Updates an environment. */
export async function updateEnvironment(userId: number, id: number, values: Record<string, unknown>) {
  const environment = await environmentModel.updateEnvironment(id, userId, values);
  if (!environment) throw new NotFoundError("Environment not found");
  return environment;
}

/** Deletes an environment. */
export async function deleteEnvironment(userId: number, id: number) {
  return environmentModel.deleteEnvironment(id, userId);
}

/** Activates one environment for interpolation. */
export async function activateEnvironment(userId: number, id: number) {
  const environment = await environmentModel.activateEnvironment(id, userId);
  if (!environment) throw new NotFoundError("Environment not found");
  return environment;
}

/** Reads variables for one environment. */
export async function getVariables(userId: number, id: number) {
  const variables = await environmentModel.getVariables(id, userId);
  if (!variables) throw new NotFoundError("Environment not found");
  return variables;
}

/** Bulk replaces variables for one environment. */
export async function replaceVariables(userId: number, id: number, variables: Array<Record<string, unknown>>) {
  const saved = await environmentModel.replaceVariables(id, userId, variables);
  if (!saved) throw new NotFoundError("Environment not found");
  return saved;
}
