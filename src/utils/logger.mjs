import styles from 'ansi-styles';

export default class Logging {
    static log = (args) => this.info(args);
    static middleware = (args) => console.log(`${styles.blue.open} ${args} ${styles.blue.close}`)
    static info = (args) => console.log(`${styles.blue.open}[${new Date().toLocaleString()}] [INFO]${styles.blue.close}${styles.blueBright.open} ${args} ${styles.blueBright.close}`);

    static warn = (args) => console.log(`${styles.yellow.open}[${new Date().toLocaleString()}] [WARNING]${styles.yellow.close}${styles.yellowBright.open} ${args} ${styles.yellowBright.close}`)

    static error = (args) => console.log(`${styles.red.open}[${new Date().toLocaleString()}] [ERROR]${styles.red.close}${styles.redBright.open} ${args} ${styles.redBright.close}`)

}


/**
 * Logger Middleware for incoming requests and outgoing requests
 * @function
 * @param {Request} req - Context Request
 * @param {Response} res - Context Response
 * @param {Express.NextFunction} next - Next function
 */
export function LoggerMiddleware(req, res, next){
    const { method } = req
    const path = req.originalUrl
    const userIP =
        req.headers['x-forwarded-for'] || req.socket.remoteAddress !== "::1" ?
            req.headers['x-forwarded-for'] || req.socket.remoteAddress :
                "localhost"
    Logging.middleware(`--> ${method} ${path} ${userIP}`)

    const start = Date.now()

    next()


    Logging.middleware(`<-- ${method} ${path} ${res.statusCode} ${timeDelta(start)}ms ${userIP}`)
}

export function timeDelta(start){
    return Date.now() - start
}