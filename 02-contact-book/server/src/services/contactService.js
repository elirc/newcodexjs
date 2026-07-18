const contactModel = require("../models/contactModel");
const { NotFoundError, ValidationError } = require("../middleware/errors");
const { contactsToCsv, csvToContacts } = require("../utils/csv");

/**
 * Normalizes and validates incoming contact fields.
 * @param {object} payload Raw request body.
 * @returns {{contact: object, tagIds: number[]}}
 */
function parseContactPayload(payload) {
  if (!payload.first_name?.trim() || !payload.last_name?.trim()) {
    throw new ValidationError("First name and last name are required");
  }
  const tagIds = Array.isArray(payload.tagIds) ? payload.tagIds.map(Number).filter(Boolean) : [];
  const contact = {
    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),
    email: payload.email?.trim() || null,
    phone: payload.phone?.trim() || null,
    company: payload.company?.trim() || null,
    street_address: payload.street_address?.trim() || null,
    city: payload.city?.trim() || null,
    state: payload.state?.trim() || null,
    zip_code: payload.zip_code?.trim() || null,
    country: payload.country?.trim() || null,
    notes: payload.notes?.trim() || null
  };
  return { contact, tagIds };
}

/**
 * Attaches tag arrays to contact rows.
 * @param {Array<object>} contacts Contacts.
 * @returns {Promise<Array<object>>}
 */
async function withTags(contacts) {
  const tagMap = await contactModel.findTagsForContacts(contacts.map((contact) => contact.id));
  return contacts.map((contact) => ({ ...contact, tags: tagMap.get(contact.id) || [] }));
}

/**
 * Returns paginated contacts plus metadata.
 * @param {object} query Request query.
 * @returns {Promise<object>}
 */
async function listContacts(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const { rows, total } = await contactModel.listContacts({ ...query, page, limit });
  return { contacts: await withTags(rows), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

/**
 * Returns one contact with its tags.
 * @param {number} id Contact id.
 * @returns {Promise<object>}
 */
async function getContact(id) {
  const contact = await contactModel.findContactById(id);
  if (!contact) throw new NotFoundError("Contact not found");
  return (await withTags([contact]))[0];
}

/**
 * Creates a contact and assigns tags.
 * @param {object} payload Request payload.
 * @returns {Promise<object>}
 */
async function createContact(payload) {
  const { contact, tagIds } = parseContactPayload(payload);
  const created = await contactModel.createContact(contact);
  await contactModel.replaceContactTags(created.id, tagIds);
  return getContact(created.id);
}

/**
 * Updates a contact and replaces tag assignments.
 * @param {number} id Contact id.
 * @param {object} payload Request payload.
 * @returns {Promise<object>}
 */
async function updateContact(id, payload) {
  const { contact, tagIds } = parseContactPayload(payload);
  const updated = await contactModel.updateContact(id, contact);
  if (!updated) throw new NotFoundError("Contact not found");
  await contactModel.replaceContactTags(id, tagIds);
  return getContact(id);
}

/**
 * Deletes one contact.
 * @param {number} id Contact id.
 * @returns {Promise<object>}
 */
async function deleteContact(id) {
  const deleted = await contactModel.deleteContact(id);
  if (!deleted) throw new NotFoundError("Contact not found");
  return { id };
}

/**
 * Deletes multiple contacts.
 * @param {number[]} ids Contact ids.
 * @returns {Promise<object>}
 */
async function bulkDelete(ids) {
  if (!Array.isArray(ids) || ids.length === 0) throw new ValidationError("ids must be a non-empty array");
  const deleted = await contactModel.deleteContacts(ids.map(Number).filter(Boolean));
  return { deleted };
}

/**
 * Creates CSV text for every contact.
 * @returns {Promise<string>}
 */
async function exportContacts() {
  const contacts = await withTags(await contactModel.findAllContacts());
  return contactsToCsv(contacts);
}

/**
 * Imports contacts from CSV text.
 * @param {string} csv CSV text.
 * @returns {Promise<object>}
 */
async function importContacts(csv) {
  if (!csv?.trim()) throw new ValidationError("CSV text is required");
  const rows = csvToContacts(csv);
  const created = [];
  for (const row of rows) {
    if (row.first_name && row.last_name) {
      created.push(await contactModel.createContact(parseContactPayload(row).contact));
    }
  }
  return { imported: created.length, contacts: created };
}

module.exports = { listContacts, getContact, createContact, updateContact, deleteContact, bulkDelete, exportContacts, importContacts };
