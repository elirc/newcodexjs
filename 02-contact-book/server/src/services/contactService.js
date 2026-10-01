const contactModel = require("../models/contactModel");
const { NotFoundError, ValidationError } = require("../middleware/errors");
const { contactsToCsv, csvToContacts } = require("../utils/csv");

/**
 * Normalizes and validates incoming contact fields.
 * @param {object} payload Raw request body.
 * @returns {{contact: object, tagIds: number[]}}
 */
function parseContactPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new ValidationError('Contact must be an object');
  const limits = { first_name:100, last_name:100, email:255, phone:30, company:255, street_address:255, city:100, state:100, zip_code:20, country:100, notes:100000 };
  const contact = {};
  for (const [key, limit] of Object.entries(limits)) {
    const value = payload[key];
    if (value != null && typeof value !== 'string') throw new ValidationError(`${key} must be text`);
    if (value && value.trim().length > limit) throw new ValidationError(`${key} exceeds ${limit} characters`);
    contact[key] = value?.trim() || null;
  }
  if (!contact.first_name || !contact.last_name) throw new ValidationError('First name and last name are required');
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new ValidationError('Email must be valid');
  const tagIds = [...new Set(Array.isArray(payload.tagIds) ? payload.tagIds.map(Number) : [])];
  if (tagIds.some((id) => !Number.isSafeInteger(id) || id < 1)) throw new ValidationError('Tag ids must be positive integers');
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
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page - 1) * limit))
    throw new ValidationError('page must be a positive integer and limit must be from 1 to 100');
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
  const rows = csvToContacts(csv);
  // Parse every row before opening a transaction: invalid row 20 saves no rows.
  const batch = rows.map((row, index) => {
    try {
      const { contact } = parseContactPayload(row);
      const tags = [...new Set((row.tags || '').split('|').map((tag) => tag.trim()).filter(Boolean))];
      if (tags.some((tag) => tag.length > 50)) throw new ValidationError('Tag names must be 50 characters or fewer');
      return { contact, tags };
    } catch (error) { throw new ValidationError(`CSV record ${index + 2}: ${error.message}`); }
  });
  try {
    const created = await contactModel.importContactBatch(batch);
    return { imported: created.length, contacts: created };
  } catch (error) {
    if (error.code === '23505') throw new ValidationError('An email already exists or is repeated in the CSV; no contacts were imported');
    throw error;
  }
}

module.exports = { listContacts, getContact, createContact, updateContact, deleteContact, bulkDelete, exportContacts, importContacts };
