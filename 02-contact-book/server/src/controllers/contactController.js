const contactService = require("../services/contactService");
const { sendSuccess } = require("../utils/responses");

/**
 * Handles paginated contact listing.
 */
async function list(req, res) {
  return sendSuccess(res, await contactService.listContacts(req.query));
}

/**
 * Handles one contact lookup.
 */
async function get(req, res) {
  return sendSuccess(res, await contactService.getContact(Number(req.params.id)));
}

/**
 * Handles contact creation.
 */
async function create(req, res) {
  return sendSuccess(res, await contactService.createContact(req.body), 201);
}

/**
 * Handles contact update.
 */
async function update(req, res) {
  return sendSuccess(res, await contactService.updateContact(Number(req.params.id), req.body));
}

/**
 * Handles contact deletion.
 */
async function remove(req, res) {
  return sendSuccess(res, await contactService.deleteContact(Number(req.params.id)));
}

/**
 * Handles bulk contact deletion.
 */
async function bulkDelete(req, res) {
  return sendSuccess(res, await contactService.bulkDelete(req.body.ids));
}

/**
 * Handles CSV import from JSON or raw text.
 */
async function importCsv(req, res) {
  return sendSuccess(res, await contactService.importContacts(req.body.csv || req.body));
}

/**
 * Handles CSV export.
 */
async function exportCsv(_req, res) {
  const csv = await contactService.exportContacts();
  res.header("Content-Type", "text/csv");
  res.attachment("contacts.csv");
  return res.send(csv);
}

module.exports = { list, get, create, update, remove, bulkDelete, importCsv, exportCsv };
