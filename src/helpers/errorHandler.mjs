import {CONFIG} from "../configs/envConfig.mjs";
import Logging from "../utils/logger.mjs";


/**
 /**

 *
 *
 * Return an error if any api endpoints throw
 *
 *

 * @augments {Error}
 * @typedef {Object} CustomError
 * @property {boolean} success - boolean representing request failure
 * @property {number} status - the error http status code
 * @property {string} message - error message
 * @property {string} [stackTrace] - error stack trace
 *
 * @constructor
 * @param {CustomError} err - Context Error
 * @param {Request} req - Context Response
 * @param {Response} res - Context Response
 * @param {NextFunction} next - Middleware next function
 *
 * @returns {CustomError}
 */
export function ErrorHandler(err, req, res, next) {
    const errorObject = {
        success: false,
        status: err.code ?? 500,
        message: err.message ?? "Something went wrong",
    }
    //Only show stack trace on development build
    if (CONFIG.NODE_ENV === "development") {
        errorObject.stackTrace = err.stack;
    }


    res.status(errorObject.status).json(errorObject)
    return errorObject
}
