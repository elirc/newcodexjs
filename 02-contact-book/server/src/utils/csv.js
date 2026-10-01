const { ValidationError } = require('../middleware/errors');
const HEADERS = ['first_name', 'last_name', 'email', 'phone', 'company', 'street_address', 'city', 'state', 'zip_code', 'country', 'notes', 'tags'];
function escapeCsv(value) {
    const text = value == null ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function contactsToCsv(contacts) {
    return [HEADERS.join(','), ...contacts.map((contact) => HEADERS.map((key) => escapeCsv(key === 'tags' ? (contact.tags || []).map((tag) => tag.name).join('|') : contact[key])).join(','))].join('\n');
}
/** A small state machine: delimiters only split fields outside quoted text. */
function csvToContacts(csv) {
    if (typeof csv !== 'string' || !csv.trim())
        throw new ValidationError('CSV text is required');
    const text = csv.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    let closed = false;
    function endField() { row.push(field); field = ''; closed = false; }
    function endRow() {
        endField();
        if (row.some((value) => value.trim()))
            rows.push(row);
        row = [];
    }
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            }
            else if (char === '"') {
                quoted = false;
                closed = true;
            }
            else
                field += char;
        }
        else if (char === ',')
            endField();
        else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n')
                i++;
            endRow();
        }
        else if (closed) {
            throw new ValidationError('Unexpected text after a closing CSV quote');
        }
        else if (char === '"') {
            if (field.length)
                throw new ValidationError('A quoted CSV field must start with a quote');
            quoted = true;
        }
        else
            field += char;
    }
    if (quoted)
        throw new ValidationError('Unclosed CSV quote');
    if (field.length || row.length || closed)
        endRow();
    const headers = (rows.shift() || []).map((value) => value.trim());
    if (!headers.includes('first_name') || !headers.includes('last_name'))
        throw new ValidationError('CSV headers must include first_name and last_name');
    if (new Set(headers).size !== headers.length || headers.some((key) => !HEADERS.includes(key)))
        throw new ValidationError('CSV has duplicate or unsupported headers');
    if (!rows.length || rows.length > 1000)
        throw new ValidationError('Import between 1 and 1000 contacts at a time');
    return rows.map((values, index) => {
        if (values.length !== headers.length)
            throw new ValidationError(`CSV record ${index + 2} has the wrong number of fields`);
        return Object.fromEntries(headers.map((key, i) => [key, values[i]]));
    });
}
module.exports = { contactsToCsv, csvToContacts };
