const client = require('../connection');

async function getRequestsHandler(table, fields, values, columns = '*') {
    if (fields.length !== values.length) {
        return "Invalid parameters";
    }

    let specColumns;
    if (Array.isArray(columns)) {
        specColumns = columns.map(column => `"${column}"`);
    } else {
        specColumns = columns;
    }

    const conditions = fields.map((field, index) => `"${field}" = $${index + 1}`).join(' AND ');

    let query = `
            SELECT ${specColumns} FROM "${table}" WHERE ${conditions}
    `;

    const result = await client.query(query, values)

    return result;
}

module.exports = { getRequestsHandler };