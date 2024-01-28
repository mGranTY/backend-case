import {lucia} from "lucia";
import {mongoose} from "@lucia-auth/adapter-mongoose";
import mongodb from "mongoose";
import {express} from "lucia/middleware";


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
{ _id: false })
);

export const auth = lucia({
    adapter: mongoose({
        User,
        Key,
        Session
    }),
    middleware: express(),
    env: "DEV"
});


export function AuthMiddleware(req, res, next) {
    const authRequest = auth.handleRequest(req, res);
    authRequest.validateBearerToken().then(session => {
        if (session) {
            next()
        }else{
            throw Error("Invalid token")
        }
    }).catch(e => res.status(500).json({message: e.message, success: false}));

}

export async function getUserSession(req, res) {
    const authRequest = auth.handleRequest(req, res);
    return await authRequest.validateBearerToken()
}