const tagModel = require("../models/tagModel");
const { NotFoundError, ValidationError } = require("../middleware/errors");

/**
 * Lists tags for filters and forms.
 * @returns {Promise<Array<object>>}
 */
async function listTags() {
  return tagModel.listTags();
}

/**
 * Validates tag input.
 * @param {object} payload Raw payload.
 * @returns {object}
 */
function parseTag(payload) {
  if (!payload.name?.trim()) throw new ValidationError("Tag name is required");
  return { name: payload.name.trim(), color: payload.color || "#6366f1" };
}

/**
 * Creates a tag.
 * @param {object} payload Raw payload.
 * @returns {Promise<object>}
 */
async function createTag(payload) {
  return tagModel.createTag(parseTag(payload));
}

/**
 * Updates a tag.
 * @param {number} id Tag id.
 * @param {object} payload Raw payload.
 * @returns {Promise<object>}
 */
async function updateTag(id, payload) {
  const updated = await tagModel.updateTag(id, parseTag(payload));
  if (!updated) throw new NotFoundError("Tag not found");
  return updated;
}

/**
 * Deletes a tag.
 * @param {number} id Tag id.
 * @returns {Promise<object>}
 */
async function deleteTag(id) {
  const deleted = await tagModel.deleteTag(id);
  if (!deleted) throw new NotFoundError("Tag not found");
  return { id };
}

module.exports = { listTags, createTag, updateTag, deleteTag };
