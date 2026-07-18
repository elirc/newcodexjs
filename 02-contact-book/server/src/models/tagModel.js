const db = require("../config/db");

/**
 * Lists all tags alphabetically.
 * @returns {Promise<Array<object>>}
 */
async function listTags() {
  return db("tags").select("*").orderBy("name", "asc");
}

/**
 * Creates a tag row.
 * @param {object} tag Tag payload.
 * @returns {Promise<object>}
 */
async function createTag(tag) {
  const [created] = await db("tags").insert(tag).returning("*");
  return created;
}

/**
 * Updates a tag row.
 * @param {number} id Tag id.
 * @param {object} tag Tag payload.
 * @returns {Promise<object|undefined>}
 */
async function updateTag(id, tag) {
  const [updated] = await db("tags").where({ id }).update(tag).returning("*");
  return updated;
}

/**
 * Deletes a tag row and cascades junction rows.
 * @param {number} id Tag id.
 * @returns {Promise<number>}
 */
async function deleteTag(id) {
  return db("tags").where({ id }).del();
}

module.exports = { listTags, createTag, updateTag, deleteTag };
