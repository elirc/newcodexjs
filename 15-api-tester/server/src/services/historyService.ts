import * as historyModel from "../models/historyModel";

/** Lists request history for the current user. */
export async function listHistory(userId: number, page = 1, limit = 30) {
  return historyModel.listHistory(userId, page, limit);
}

/** Clears all request history for the current user. */
export async function clearHistory(userId: number) {
  return historyModel.clearHistory(userId);
}

/** Deletes one request history row. */
export async function deleteHistory(userId: number, id: number) {
  return historyModel.deleteHistory(id, userId);
}
