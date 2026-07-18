/**
 * Seeds tags, contacts, and deterministic many-to-many assignments.
 * @param {import("knex").Knex} knex Knex instance.
 * @returns {Promise<void>}
 */
exports.seed = async function seed(knex) {
  await knex("contact_tags").del();
  await knex("contacts").del();
  await knex("tags").del();

  const tagRows = [
    ["Family", "#ef4444"],
    ["Friends", "#f59e0b"],
    ["Work", "#2563eb"],
    ["VIP", "#7c3aed"],
    ["Lead", "#16a34a"],
    ["Vendor", "#0891b2"],
    ["Newsletter", "#64748b"],
    ["Archived", "#78716c"]
  ].map(([name, color]) => ({ name, color }));
  const tags = await knex("tags").insert(tagRows).returning("*");
  const firstNames = ["Avery", "Jordan", "Taylor", "Morgan", "Riley", "Casey", "Jamie", "Quinn", "Harper", "Rowan"];
  const lastNames = ["Bennett", "Chen", "Diaz", "Ellis", "Foster", "Garcia", "Hayes", "Iverson", "Jones", "Khan"];
  const companies = ["Northstar Studio", "Bluebird Labs", "Cedar Health", "Metro Supply", "Luma Finance"];
  const contacts = [];
  for (let index = 0; index < 50; index += 1) {
    contacts.push({
      first_name: firstNames[index % firstNames.length],
      last_name: `${lastNames[index % lastNames.length]} ${index + 1}`,
      email: `person${index + 1}@example.com`,
      phone: index % 5 === 0 ? null : `555-01${String(index).padStart(2, "0")}`,
      company: companies[index % companies.length],
      street_address: `${100 + index} Market Street`,
      city: ["Seattle", "Austin", "Denver", "Chicago", "Boston"][index % 5],
      state: ["WA", "TX", "CO", "IL", "MA"][index % 5],
      zip_code: `90${String(index).padStart(3, "0")}`,
      country: "USA",
      notes: index % 4 === 0 ? "Prefers email follow-up." : null
    });
  }
  const createdContacts = await knex("contacts").insert(contacts).returning("*");
  const assignments = createdContacts.flatMap((contact, index) => {
    const count = (index % 3) + 1;
    return Array.from({ length: count }, (_, offset) => ({
      contact_id: contact.id,
      tag_id: tags[(index + offset) % tags.length].id
    }));
  });
  await knex("contact_tags").insert(assignments);
};
