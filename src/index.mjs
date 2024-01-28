//Server framework
import express from 'express';
// MONGODB ODM
import mongoose from "mongoose";
// ENV BUT TYPE SAFE AND RUNTIME CHECKED
import {CONFIG} from "./configs/envConfig.mjs";
//cors middleware
import cors from 'cors'
// LOGGER UTIL
import Logging, {LoggerMiddleware} from "./utils/logger.mjs";
//error handler middleware
import {ErrorHandler} from "./helpers/errorHandler.mjs";
//Auth Middleware, all routes below it will need authentication
import {AuthMiddleware} from "./utils/lucia.mjs";
//ROUTES
import {documentRouter} from "./routes/documentRouter.mjs";
import {authRouter} from "./routes/authRouter.mjs";


const app = express()


//Native JSON body parser
app.use(express.json())
app.use(express.urlencoded({extended: true}));


//Cors Handler
// @TODO: ADD PROPER ORIGIN
app.use(cors({
    origin: '*',
    methods: "GET,PUT,POST,DELETE",
    preflightContinue: true,
    optionsSuccessStatus: 204,
}))
app.options('*', cors())


//Request Logger
app.use(LoggerMiddleware)

//Auth Router | All Account related endpoints
app.use(authRouter)


//All routes are protected by the auth middleware, it requires the user to have a valid session
app.use(AuthMiddleware)
//All Document endpoints
app.use(documentRouter)



//Error handlers
//page not found error Handler
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.code = 404;
    next(err);
});

//General error handler
app.use(ErrorHandler)

//Start server
function startServer() {
    mongoose
        .connect(CONFIG.MONGODB_URI, {
            retryWrites: true,
            writeConcern: {w: 'majority'},
        })
        .then(() => {
            Logging.info('Connected to MongoDB');
            app.listen(CONFIG.PORT, () => {
                Logging.info(`Server running on port ${CONFIG.PORT}`)
            })
        })
        .catch((error) => {
            Logging.error(error);
        });
}

startServer()