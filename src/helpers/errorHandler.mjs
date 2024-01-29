import {CONFIG} from "../configs/envConfig.mjs";

/**
 * Custom error handler middleware for Express.js
 *
 * This middleware returns a JSON response with error details whenever an API endpoint throws an error.
 * The response includes a boolean representing request failure, the HTTP status code for the error, and an error message.
 * If the application is running in a development environment, the response will also include the error stack trace.
 *
 * @augments {Error}
 * @typedef {Object} CustomError
 * @property {boolean} success - boolean representing request failure
 * @property {number} status - the error http status code
 * @property {string} message - error message
 * @property {string} [stackTrace] - error stack trace
 *
 * @constructor
 * @param {CustomError} err - Contextual error object
 * @param {Request} req - Express.js request object
 * @param {Response} res - Express.js response object
 * @param {NextFunction} next - Express.js middleware next function
 *
 * @returns {CustomError}
 */
export function ErrorHandler(err, req, res, next) {
    // Prepare a default response object
    const errorObject = {
        // Indicate that the request has failed
        success: false,
        // Include the error code, default to 500 (Internal Server Error) if it doesn't exist
        status: err.code ?? 500,
        // Include the error message, default to "Something went wrong" if it doesn't exist
        message: err.message ?? "Something went wrong",
    }

    // Include the error stack trace in the response if the application is running in a development environment
    if (CONFIG.NODE_ENV === "development") {
        errorObject.stackTrace = err.stack;
    }

    // Return the error as a JSON response with the correct status code
    res.status(errorObject.status).json(errorObject)
    // Return the error object for further handling
    next()
    return errorObject
}

