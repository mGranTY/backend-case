import express from 'express';
import {createAccount, login} from "../controller/authController.js";


export const authRouter = express.Router();

authRouter.post('/register', createAccount);
authRouter.post('/login', login);

