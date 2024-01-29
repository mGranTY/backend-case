// Imports the necessary modules
import {auth} from "../utils/lucia.mjs"; // Import authentication module
import Logging from "../utils/logger.mjs"; // Import logging module
import {z} from "zod"; // Import zod for schema validation

// Schemas for account creation and login
const AccountSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(32),
});

// Function for creating a new account
export async function createAccount(req, res){
    try {
        const { email, password } = AccountSchema.parse(req.body); // Validate and parse request body
        // Try to create the user, await for the function to complete
        await auth.createUser({
            key: {
                providerId: "email",
                providerUserId: `${email}`,
                password: `${password}`
            },
            attributes: {
                username: `${email}`
            }
        });

        res.status(200).json({message: "Account created!", success: true});
    } catch (e) {
        Logging.error(e); // Log the error
        res.status(500).json({message: e.message, success: false});
    }
}

// Function for logging in
export async function login(req, res){
    try {
        const { email, password } = AccountSchema.parse(req.body) // Validate and parse request body
        const key = await auth.useKey("email", email, password);

        if (!key) {
            throw new Error('Invalid credentials');
        }

        const user = await auth.getUser(key.userId);
        const session = await auth.createSession({
            userId: user.userId,
            attributes: {}
        });

        res.status(200).json({session: session.sessionId, success: true});
    } catch (e) {
        Logging.error(e); // Log the error
        res.status(500).json({message: e.message, success: false});
    }
}