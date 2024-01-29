// Import Lucia library for authentication
import {lucia} from "lucia";

// Import the mongoose adapter from Lucia
import {mongoose} from "@lucia-auth/adapter-mongoose";

// Import mongoose library to define mongoose models
import mongodb from "mongoose";

// Import express middleware from Lucia
import {express} from "lucia/middleware";
import {CONFIG} from "../configs/envConfig.mjs";

// Define the User model with _id and username fields
const User = mongodb.model(
    "User",
    new mongodb.Schema(
        {
            _id: {
                type: String,
                required: true
            },
            username: {
                type: String,
                required: true
            }
        },
        { _id: false }
    )
);

// Define the Key model with _id, user_id and hashed_password fields
const Key = mongodb.model(
    "Key",
    new mongodb.Schema(
        {
            _id: {
                type: String,
                required: true
            },
            user_id: {
                type: String,
                required: true
            },
            hashed_password: String
        },
        { _id: false }
    )
);

// Define the Session model with _id, user_id, active_expires and idle_expires fields
const Session = mongodb.model(
    "Session",
    new mongodb.Schema(
        {
            _id: {
                type: String,
                required: true
            },
            user_id: {
                type: String,
                required: true
            },
            active_expires: {
                type: Number,
                required: true
            },
            idle_expires: {
                type: Number,
                required: true
            }
        },
        { _id: false }
    )
);

// Export the lucia auth config which uses mongoose adapter and express middleware
export const auth = lucia({
    adapter: mongoose({
        User,
        Key,
        Session
    }),
    middleware: express(),
    env: CONFIG.NODE_ENV === "development" ? "DEV" : "PROD"
});

// Export authentication middleware function to validate bearer token
// Sends an error response if token is not valid
export function AuthMiddleware(req, res, next) {
    const authRequest = auth.handleRequest(req, res);
    authRequest.validateBearerToken().then(session => {
        if (session) {
            next()
        } else {
            throw Error("Invalid token")
        }
    }).catch(e => res.status(500).json({message: e.message, success: false}));
}

// Export asynchronous function to get user session
export async function getUserSession(req, res) {
    const authRequest = auth.handleRequest(req, res);
    return await authRequest.validateBearerToken();
}