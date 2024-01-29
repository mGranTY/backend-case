import {createAccount} from "../../src/controller/authController.js";
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
        expect(result.success).toBe(true);
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

});


