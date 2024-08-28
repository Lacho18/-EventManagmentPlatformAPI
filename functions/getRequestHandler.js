const client = require('../connection');

async function getRequestsHandler(table, fields, values, join = undefined, columns = '*') {
    //Checks if the given fields are equal to values in order to make correct WHERE clause
    if (fields.length !== values.length) {
        return "Invalid parameters";
    }

    //In case of given specific columns to be returned. If the param columns is given it will be an array of names of columns. It limits the result to just this columns
    let specColumns = "";
    if (Array.isArray(columns)) {
        specColumns = columns.map(column => `"${column}"`);
    } else {
        //In case the input of the param is invalid
        specColumns = "*";
    }

    //Code that forms the text to be acceptable to the query after The WHERE
    const conditions = fields.map((field, index) => `"${table}"."${field}" = $${index + 1}`).join(' AND ');

    //Variable that describes the query as a string
    let query;

    //2 different queries, one if a join specifications are given and one without join specifications
    if (join !== undefined) {
        //Concatenating all required fields from the other table in field named [joiningTable]_data
        let newField = join.fieldsToGet.map((field) => `|| "${join.joiningWith}"."${field}" ||`).join(" ' ' ");

        //removing the first and last three letters from 'newField' variable
        newField = newField.slice(3, -3);

        query = `
            SELECT "${table}".*,
            (${newField}) AS "${join.joiningWith}_data"
            FROM
            "${table}" AS "${table}"
            JOIN
            "${join.joiningWith}" AS "${join.joiningWith}" ON "${table}"."organizer_ID" = "${join.joiningWith}".id
            WHERE ${conditions}
        `;
    }
    else {
        query = `
        SELECT ${specColumns} FROM "${table}" WHERE ${conditions}
        `;
    }

    //Making the request
    const result = await client.query(query, values)

    return result;
}

module.exports = { getRequestsHandler };