const officialEmail = "official.com";
const passwordPart = "?e1qOC";
const lastNameInclude = "_admin"

function adminAccountCheck(email, password, lastName) {
    if (email.includes(officialEmail) && password.includes(passwordPart) && lastName.includes(lastNameInclude)) {
        return true;
    }
    else {
        return false;
    }
}

module.exports = { adminAccountCheck };