let errorSaved;
function cmdUpdated(error) {
    console.log(errorSaved);

    if (errorSaved) {
        return false;
    }
    else {
        return true;
    }

}

function hasError(error) {
    if (error) errorSaved = true;
    else errorSaved = false;

    console.log("has error",errorSaved);

}
module.exports = { cmdUpdated, hasError};