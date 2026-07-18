/**
 * Escapes a single CSV field according to RFC-style quoting.
 * @param {unknown} value Raw value.
 * @returns {string} CSV-safe value.
 */
function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Converts contacts into a CSV string for downloads.
 * @param {Array<object>} contacts Contacts with optional tags.
 * @returns {string} CSV document.
 */
function contactsToCsv(contacts) {
  const headers = ["first_name", "last_name", "email", "phone", "company", "street_address", "city", "state", "zip_code", "country", "notes", "tags"];
  const rows = contacts.map((contact) =>
    headers.map((key) => escapeCsv(key === "tags" ? (contact.tags || []).map((tag) => tag.name).join("|") : contact[key])).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

/**
 * Parses simple CSV text into contact records for educational imports.
 * @param {string} csv CSV text with a header row.
 * @returns {Array<object>} Parsed contacts.
 */
function csvToContacts(csv) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce((record, header, index) => {
      record[header] = values[index] || null;
      return record;
    }, {});
  });
}

module.exports = { contactsToCsv, csvToContacts };
