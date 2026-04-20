const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    sendError(res, err.message || 'Server Error', err.statusCode || 500);
};

module.exports = errorHandler;
