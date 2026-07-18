const tagService = require("../services/tagService");
const { sendSuccess } = require("../utils/responses");

/**
 * Handles tag listing.
 */
async function list(_req, res) {
  return sendSuccess(res, await tagService.listTags());
}

/**
 * Handles tag creation.
 */
async function create(req, res) {
  return sendSuccess(res, await tagService.createTag(req.body), 201);
}

/**
 * Handles tag update.
 */
async function update(req, res) {
  return sendSuccess(res, await tagService.updateTag(Number(req.params.id), req.body));
}

/**
 * Handles tag deletion.
 */
async function remove(req, res) {
  return sendSuccess(res, await tagService.deleteTag(Number(req.params.id)));
}

module.exports = { list, create, update, remove };
