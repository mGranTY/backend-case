import {createAccount, login} from "../../src/controller/authController.js";
import {beforeAll, describe, expect, test, vi} from "vitest";
import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";

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

describe('createAccount', () => {
    test('Deveria criar uma conta com credenciais válidas', async () => {

        const req = {
            body: {
                email: 'test@gmail.com',
                password: 'senha123',
            },
        };

        const res = {
            success: vi.fn(),
            message: vi.fn(),
            status: vi.fn(() => res), // Return the res object when status is called
            json: vi.fn(() => res)    // Return the res object when json is called
        };


        const result = await createAccount(req, res);
        expect(result.success).toBeTruthy();
        expect(result).toStrictEqual({message: "Account created!", success: true});
    });

    test('Deveria retornar erro ao tentar criar conta com email inválido', async () => {
        const req = {
            body: {
                email: 'email-invalido',
                password: 'senha123',
            },
        };

        const res = {
            success: vi.fn(),
            message: vi.fn(),
            status: vi.fn(() => res), // Return the res object when status is called
            json: vi.fn(() => res)    // Return the res object when json is called
        };
        const result = await createAccount(req, res);
        expect(result.success).toBe(false);
    });



    test('Deveria retornar erro ao tentar criar conta com uma senha inválida', async () => {
        const req = {
            body: {
                email: 'email@gmail.com',
                password: '😂😂',
            },
        };

        const res = {
            success: vi.fn(),
            message: vi.fn(),
            status: vi.fn(() => res), // Return the res object when status is called
            json: vi.fn(() => res)    // Return the res object when json is called
        };
        const result = await createAccount(req, res);
        expect(result.success).toBe(false);
    });

});



describe('login', () => {
    test('Deveria entrar em uma conta com credenciais válidas', async () => {

        const req = {
            body: {
                email: 'test@gmail.com',
                password: 'senha123',
            },
        };

        const res = {
            success: vi.fn(),
            message: vi.fn(),
            status: vi.fn(() => res),
            json: vi.fn(() => res)
        };


        const result = await login(req, res);
        console.log(result.session.length)
        expect(result.success).toBeTruthy();
        expect(result.session).toBeDefined()
        //Valid Session string length
        expect(result.session.length).toBe(40);
    });

    test('Deveria retornar erro ao tentar entrar em uma conta com uma senha inválida', async () => {

        const req = {
            body: {
                email: 'test@gmail.com',
                password: 'senha12',
            },
        };

        const res = {
            success: vi.fn(),
            message: vi.fn(),
            status: vi.fn(() => res),
            json: vi.fn(() => res)
        };


        const result = await login(req, res);
        expect(result.success).toBeFalsy();
        expect(result.session).toBeUndefined()
        expect(result.message).toBeDefined()
        expect(result.message).toBe("AUTH_INVALID_PASSWORD")
    })

    test('Deveria retornar erro ao tentar entrar em uma conta com um email/key inválida', async () => {

        const req = {
            body: {
                email: 'test2@gmail.com',
                password: 'senha123',
            },
        };

        const res = {
            success: vi.fn(),
            message: vi.fn(),
            status: vi.fn(() => res),
            json: vi.fn(() => res)
        };


        const result = await login(req, res);
        console.log(result.message)
        expect(result.success).toBeFalsy();
        expect(result.session).toBeUndefined()
        expect(result.message).toBeDefined()
        expect(result.message).toBe("AUTH_INVALID_KEY_ID")
    })

});