// dotenv is a zero-dependency module that loads environment variables from a .env file into process.env
import {config} from "dotenv";
// zod is a library for creating schemas and validating data
import { z } from "zod";

// Calling config will read your .env file, parse the contents, and assign it to process.env
config()

// Here we are defining the shape of our environment configuration with zod.
// Zod will help us validate that our environment variables match this schema when the application starts.
// If the validation fails, zod will throw an error.
const envSchema = z.object({
    MONGODB_URI: z.string().startsWith("mongodb://" || "mongodb+srv://", 'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://'),
    PORT: z.number(),
    NODE_ENV: z.string("production" || "development"),
    OPEN_AI_API_KEY: z.string()
});

// Here we are parsing the environment variables through our zod schema.
// The resulting CONFIG object will have a friendly API and the guarantee to match the schema defined above.
export const CONFIG = envSchema.parse({
    MONGODB_URI: process.env.MONGODB_URI,
    PORT: Number(process.env.PORT),
    NODE_ENV: process.env.NODE_ENV,
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY
});