import {auth} from "../utils/lucia.mjs";
import Logging from "../utils/logger.mjs";
import {z} from "zod";
import {LuciaError} from "lucia";

const AccountSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(32),
});

export function createAccount(req, res){
    try {
        const { email, password } = AccountSchema.parse(req.body)
        const user = auth.createUser({
            key: {
                providerId: "email",
                providerUserId: `${email}`,
                password: `${password}`
            },
            attributes: {
                username: `${email}`
            }
        }).then(r => {
            res.status(200).json({message: "Account created!", success: true});
        }).catch(e => res.status(500).json({message: e.message, success: false}));
    } catch (e) {
        Logging.error(e)
        res.status(500).json({message: e, success: false});
    }
}

export function login(req, res){
    try {
        const { email, password } = AccountSchema.parse(req.body)
        auth.useKey("email", email, password).then(key => {
            if(key){
                auth.getUser(key.userId).then(user => {
                    auth.createSession({
                        userId: user.userId,
                        attributes: {}
                    }).then(session => {
                        res.status(200).json({session: session.sessionId, success: true});
                    }).catch(e => res.status(500).json({message: e.message, success: false}));
                }).catch(e => res.status(500).json({message: e.message, success: false}));
            }
        }).catch(e => res.status(500).json({message: e.message, success: false}));
    } catch (e) {
        Logging.error(e)
        res.status(500).json({message: e, success: false});
    }
}