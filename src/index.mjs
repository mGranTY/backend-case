// Import server framework.
import express from 'express';
// Import MongoDB ODM (Object Data Modeling) library.
import mongoose from "mongoose";
// Import run-time type checked configuration file.
import {CONFIG} from "./configs/envConfig.mjs";
// Import compression middleware
import compression from "express-compression";
// Import CORS (Cross-Origin Resource Sharing) middleware.
import cors from 'cors'
// Import logger utility.
import Logging, {LoggerMiddleware} from "./utils/logger.mjs";
// Import error handler middleware.
import {ErrorHandler} from "./helpers/errorHandler.mjs";
// Import authentication middleware. All routes below it will require authentication.
import {AuthMiddleware} from "./utils/lucia.mjs";
// Import routes.
import {documentRouter} from "./routes/documentRouter.mjs";
import {authRouter} from "./routes/authRouter.mjs";


// Initialize express app.
const app = express();

// Use JSON body parser provided natively by Express.
app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(compression())

// Configure CORS (Cross-Origin Resource Sharing).
app.use(cors({
    origin: '*',
    methods: "GET,PUT,POST,DELETE",
    preflightContinue: true,
    optionsSuccessStatus: 204,
}));
app.options('*', cors());

// Use log request middleware.
app.use(LoggerMiddleware)

// Use the authentication Router for all account related endpoints.
app.use(authRouter);

// Protect all routes using the auth middleware. It requires the user to have a valid session.
app.use(AuthMiddleware);
// Use Document Router for all document endpoints.
app.use(documentRouter);

// Use error handling middlewares.
// Handler for page not found errors (404).
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.code = 404;
    next(err);
});

// Use general error handler.
app.use(ErrorHandler);

// Function to start server.
function startServer() {
    mongoose
        .connect(CONFIG.MONGODB_URI, {
            retryWrites: true,
            writeConcern: {w: 'majority'},
        })
        .then(() => {
            // Log successful MongoDB connection.
            Logging.info('Connected to MongoDB');
            // Start server and log port the server is running on.
            app.listen(CONFIG.PORT, () => {
                Logging.info(`Server running on port ${CONFIG.PORT}`)
            })
        })
        .catch((error) => {
            // Log error if connection to MongoDB fails.
            Logging.error(error);
        });
}

// Start the server.
startServer();