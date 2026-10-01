const db = require("../config/db");

const CONTACT_COLUMNS = [
  "id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "company",
  "street_address",
  "city",
  "state",
  "zip_code",
  "country",
  "notes",
  "created_at",
  "updated_at"
];

/**
 * Builds the filtered contact query shared by listing and counting.
 * @param {object} filters Query filters.
 * @returns {import("knex").Knex.QueryBuilder}
 */
function baseContactQuery(filters = {}) {
  const query = db("contacts").select("contacts.*");
  if (filters.search) {
    query.where((builder) => {
      builder
        .whereILike("first_name", `%${filters.search}%`)
        .orWhereILike("last_name", `%${filters.search}%`)
        .orWhereILike("email", `%${filters.search}%`)
        .orWhereILike("company", `%${filters.search}%`);
    });
  }
  if (filters.tag) {
    query
      .join("contact_tags", "contacts.id", "contact_tags.contact_id")
      .join("tags", "tags.id", "contact_tags.tag_id")
      .where("tags.name", filters.tag);
  }
  return query;
}

/**
 * Lists contacts with pagination, sorting, search, and tag filtering.
 * @param {object} options List options.
 * @returns {Promise<{rows: Array<object>, total: number}>}
 */
async function listContacts(options) {
  const page = Number(options.page || 1);
  const limit = Math.min(Number(options.limit || 20), 100);
  const sort = ["first_name", "last_name", "email", "company", "created_at"].includes(options.sort) ? options.sort : "last_name";
  const order = options.order === "desc" ? "desc" : "asc";
  const countRow = await baseContactQuery(options).clone().clearSelect().countDistinct("contacts.id as count").first();
  const rows = await baseContactQuery(options)
    .distinct("contacts.*")
    .orderBy(`contacts.${sort}`, order)
    .orderBy("contacts.id", "asc")
    .limit(limit)
    .offset((page - 1) * limit);
  return { rows, total: Number(countRow.count) };
}

/**
 * Finds a contact by id.
 * @param {number} id Contact id.
 * @returns {Promise<object|undefined>}
 */
async function findContactById(id) {
  return db("contacts").where({ id }).first();
}

/**
 * Finds all contacts without pagination for CSV export.
 * @returns {Promise<Array<object>>}
 */
async function findAllContacts() {
  return db("contacts").select(CONTACT_COLUMNS).orderBy("last_name", "asc");
}

/**
 * Inserts a contact row.
 * @param {object} contact Contact payload.
 * @returns {Promise<object>}
 */
async function createContact(contact) {
  const [created] = await db("contacts").insert(contact).returning("*");
  return created;
}

/**
 * Updates a contact row.
 * @param {number} id Contact id.
 * @param {object} contact Contact payload.
 * @returns {Promise<object|undefined>}
 */
async function updateContact(id, contact) {
  const [updated] = await db("contacts")
    .where({ id })
    .update({ ...contact, updated_at: db.fn.now() })
    .returning("*");
  return updated;
}

/**
 * Deletes one contact row.
 * @param {number} id Contact id.
 * @returns {Promise<number>}
 */
async function deleteContact(id) {
  return db("contacts").where({ id }).del();
}

/**
 * Deletes many contact rows in one query.
 * @param {number[]} ids Contact ids.
 * @returns {Promise<number>}
 */
async function deleteContacts(ids) {
  return db("contacts").whereIn("id", ids).del();
}

/**
 * Replaces all tags for a contact.
 * @param {number} contactId Contact id.
 * @param {number[]} tagIds Tag ids.
 * @returns {Promise<void>}
 */
async function replaceContactTags(contactId, tagIds = []) {
  await db.transaction(async (trx) => {
    await trx("contact_tags").where({ contact_id: contactId }).del();
    if (tagIds.length > 0) {
      await trx("contact_tags").insert(tagIds.map((tagId) => ({ contact_id: contactId, tag_id: tagId })));
    }
  });
}

/**
 * Loads tags grouped by contact id.
 * @param {number[]} contactIds Contact ids.
 * @returns {Promise<Map<number, Array<object>>>}
 */
async function findTagsForContacts(contactIds) {
  if (contactIds.length === 0) return new Map();
  const rows = await db("contact_tags")
    .join("tags", "tags.id", "contact_tags.tag_id")
    .whereIn("contact_tags.contact_id", contactIds)
    .select("contact_tags.contact_id", "tags.id", "tags.name", "tags.color")
    .orderBy("tags.name", "asc");
  return rows.reduce((map, row) => {
    const tags = map.get(row.contact_id) || [];
    tags.push({ id: row.id, name: row.name, color: row.color });
    map.set(row.contact_id, tags);
    return map;
  }, new Map());
}

/** One transaction covers contacts, tag creation and junction rows. */
async function importContactBatch(batch) {
  return db.transaction(async (trx) => {
    const contacts = [];
    for (const { contact, tags } of batch) {
      const [created] = await trx('contacts').insert(contact).returning('*');
      const attached = [];
      for (const name of tags) {
        await trx('tags').insert({ name }).onConflict('name').ignore();
        const tag = await trx('tags').where({ name }).first();
        await trx('contact_tags').insert({ contact_id: created.id, tag_id: tag.id });
        attached.push(tag);
      }
      contacts.push({ ...created, tags: attached });
    }
    return contacts;
  });
}

module.exports = {
  importContactBatch,
  listContacts,
  findContactById,
  findAllContacts,
  createContact,
  updateContact,
  deleteContact,
  deleteContacts,
  replaceContactTags,
  findTagsForContacts
};
