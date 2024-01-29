// Importing ansi-styles for logging in color.
import styles from 'ansi-styles';

// Define the Logging class.
export default class Logging {
    // Default logging function (alias to info)
    static log = (args) => this.info(args);
    // Middleware logging function with blue color
    static middleware = (args) => console.log(`${styles.blue.open} ${args} ${styles.blue.close}`);
    // Info logging function with blue color
    static info = (args) => console.log(`${styles.blue.open}[${new Date().toLocaleString()}] [INFO]${styles.blue.close}${styles.blueBright.open} ${args} ${styles.blueBright.close}`);
    // Warning logging function with yellow color
    static warn = (args) => console.log(`${styles.yellow.open}[${new Date().toLocaleString()}] [WARNING]${styles.yellow.close}${styles.yellowBright.open} ${args} ${styles.yellowBright.close}`);
    // Error logging function with red color
    static error = (args) => console.log(`${styles.red.open}[${new Date().toLocaleString()}] [ERROR]${styles.red.close}${styles.redBright.open} ${args} ${styles.redBright.close}`);
}

/**
 * Logger Middleware for incoming and outgoing requests
 * @function
 * @param {Request} req - Context Request
 * @param {Response} res - Context Response
 * @param {Express.NextFunction} next - Next function
 */
export function LoggerMiddleware(req, res, next){
    const { method } = req;
    const path = req.originalUrl;
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress !== "::1" ? req.headers['x-forwarded-for'] || req.socket.remoteAddress : "localhost";
    // Begin logging request
    Logging.middleware(`--> ${method} ${path} ${userIP}`);

    const start = Date.now();

    next();

    // Finish logging request response with status and response time in milliseconds.
    Logging.middleware(`<-- ${method} ${path} ${res.statusCode} ${timeDelta(start)}ms ${userIP}`);
}

// Function used for calculating time difference between the request being made and the function execution time.
export function timeDelta(start){
    return Date.now() - start;
}