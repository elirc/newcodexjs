import { db } from "../config/db";

/** Lists collections with one-level folders and saved requests. */
export async function listCollectionTree(userId: number) {
  const collections = await db("collections").where({ user_id: userId }).orderBy("sort_order", "asc");
  const collectionIds = collections.map((collection) => collection.id);
  const folders = collectionIds.length ? await db("folders").whereIn("collection_id", collectionIds).orderBy("sort_order", "asc") : [];
  const requests = collectionIds.length ? await db("saved_requests").where({ user_id: userId }).whereIn("collection_id", collectionIds).orderBy("sort_order", "asc") : [];
  return collections.map((collection) => ({
    ...collection,
    folders: folders
      .filter((folder) => folder.collection_id === collection.id)
      .map((folder) => ({ ...folder, requests: requests.filter((request) => request.folder_id === folder.id) })),
    requests: requests.filter((request) => request.collection_id === collection.id && !request.folder_id)
  }));
}

/** Creates a collection. */
export async function createCollection(userId: number, values: Record<string, unknown>) {
  const [collection] = await db("collections").insert({ ...values, user_id: userId }).returning("*");
  return collection;
}

/** Updates a collection. */
export async function updateCollection(id: number, userId: number, values: Record<string, unknown>) {
  const [collection] = await db("collections").where({ id, user_id: userId }).update({ ...values, updated_at: db.fn.now() }).returning("*");
  return collection;
}

/** Deletes a collection and cascades folders plus contained saved requests. */
export async function deleteCollection(id: number, userId: number) {
  return db("collections").where({ id, user_id: userId }).delete();
}

/** Creates a one-level folder inside a collection. */
export async function createFolder(collectionId: number, values: Record<string, unknown>) {
  const [folder] = await db("folders").insert({ ...values, collection_id: collectionId }).returning("*");
  return folder;
}

/** Updates a collection folder. */
export async function updateFolder(id: number, values: Record<string, unknown>) {
  const [folder] = await db("folders").where({ id }).update(values).returning("*");
  return folder;
}

/** Deletes a folder and cascades contained saved requests. */
export async function deleteFolder(id: number) {
  return db("folders").where({ id }).delete();
}

/** Exports a collection tree for JSON download. */
export async function exportCollection(id: number, userId: number) {
  const tree = await listCollectionTree(userId);
  return tree.find((collection) => collection.id === id);
}
