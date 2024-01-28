//Node v20.6.0 implementa variaveis de ambiente de maneira nativa
import {config} from "dotenv";
//Runtime Validation
import { z } from "zod";

config()


const envSchema = z.object({
    MONGODB_URI: z.string().startsWith("mongodb://" || "mongodb+srv://", 'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://'),
    PORT: z.number(),
    NODE_ENV: z.string("production" || "development"),
    OPEN_AI_API_KEY: z.string()
});


export const CONFIG = envSchema.parse({
    MONGODB_URI: process.env.MONGODB_URI,
    PORT: Number(process.env.PORT),
    NODE_ENV: process.env.NODE_ENV,
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY
});