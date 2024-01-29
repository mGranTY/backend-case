import {createAccount, login} from "../../src/controller/authController.js";
import {beforeAll , afterAll, describe, expect, test, vi} from "vitest";
import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";
import {auth, getUserSession} from "../../src/utils/lucia.mjs";

beforeAll(() => {
    (async () => {
        const mongod = await MongoMemoryServer.create();

        const uri = mongod.getUri();
        console.log(uri)
        await mongoose.connect(uri, {
            retryWrites: true,
            writeConcern: {w: 'majority'},
        })
    })();

})

describe('Session', () => {
    test('Deve criar uma conta valida, entrar nela e utilizar sua chave de sessão', async () => {

        const req = {
            auth: vi.fn(() => [req]),
            headers: new Headers,
            method: "GET",
            body: {
                email: 'test@gmail.com',
                password: 'senha123',
            },
        };
        const res = {
            status: vi.fn(() => res),
            json: vi.fn(() => res)
        };





        const createAccountResult = await createAccount(req, res);
        expect(createAccountResult.success).toBeTruthy();
        expect(createAccountResult).toStrictEqual({message: "Account created!", success: true});

        const loginResult = await login(req, res);
        expect(loginResult.success).toBeTruthy();
        expect(loginResult.session).toBeDefined()
        //Valid Session string length
        expect(loginResult.session.length).toBe(40);

        req.headers.set('authorization', `Bearer ${loginResult.session}`)
        req.headers.set('Origin', "*")

        const userSession = await auth.getSession(loginResult.session)
        expect(userSession.sessionId).toBe(loginResult.session)
        expect(userSession.user.userId).toBeDefined()
        expect(userSession.state).toBe('active')
    });
});


afterAll(async () => {
    await mongoose.disconnect();
})