import assert = require('assert');
import crypto = require('crypto');
import { test } from 'node:test';
import helpers = require('./helpers/test_app');
import { ValidationSchema } from 'fastest-validator';
import { IRequestValidationSchema, IRequestValidationError } from '../index';

const schema: ValidationSchema<{name: string}> = {
   name: { type: 'string', min: 3, max: 255 },
};
const userSchema: IRequestValidationSchema</*Body*/{name: string}, {}, /*Params*/{userId: string}> = {
   body: {
      name: { type: 'string', min: 3, max: 255 },
   },
   params: {
      userId: { type: 'uuid' },
   },
};
const app = helpers.appFactory(schema, userSchema);

const TEST_PORT = Number(process.env.TEST_PORT) || 3333;
const server = app.listen(TEST_PORT, async () =>
{
   await test('fastest-express-validator', async (t) =>
   {
      await Promise.all([
         t.test('RequestValidator', async (tt) =>
         {
            await Promise.all([
               tt.test('QUERY', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('missing a required query param', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/query`);
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with a missed required query param is not rejected');
                        assert.strictEqual('query' in parsedBody, true, 'response body does not contains a "query" field');
                        assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', 'response body does not contains an error description');
                     }),

                     ttt.test('invalid query', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/query?name=xx`);
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with an invalid query field is not rejected');
                        assert.strictEqual('query' in parsedBody, true, 'response body does not contains a "query" field');
                        assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', 'response body does not contains an error description');
                     }),

                     ttt.test('correct query', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/query?name=xxx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, 'request with a correct query field is rejected');
                     }),
                  ]);
               }),

               tt.test('PARAMS', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('invalid params', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/params/xx`);
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with an invalid url pattern is not rejected');
                        assert.strictEqual('params' in parsedBody, true, 'response body does not contains a "params" field');
                        assert.strictEqual(typeof parsedBody?.params?.[0]?.message, 'string', 'response body does not contains an error description');
                     }),

                     ttt.test('correct params', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/params/xxx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, 'request with a correct params field is rejected');
                     }),
                  ]);
               }),

               tt.test('BODY', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('missing a required body field', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with a missed required body field is not rejected');
                        assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field');
                        assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains an error description');
                     }),

                     ttt.test('incomplete body', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 5}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with an incomplete body is not rejected');
                        assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field');
                        assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains an error description');
                     }),

                     ttt.test('broken body', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: '{"name: 5}',
                        });
                        const parsedBody = await res.json();

                        assert.strictEqual(res.status, 500, 'runtime error (broken json parsing) is not catched');
                        assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description');
                     }),

                     ttt.test('correct body', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'xxx'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, 'request with a correct body is rejected');
                     }),

                  ]);
               }),
            ]);
         }),


         t.test('QueryValidator', async (tt) =>
         {
            await Promise.all([
               tt.test('WITHOUT a custom error handler', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('missing a required query param', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/simple/query`);
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with a missed required query param is not rejected (simple, without a custom error handler)');
                        assert.strictEqual('query' in parsedBody, true, 'response body does not contains a "query" field (simple, without a custom error handler)');
                        assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
                     }),

                     ttt.test('invalid query', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/simple/query?name=xx`);
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with an invalid query field is not rejected (simple, without a custom error handler)');
                        assert.strictEqual('query' in parsedBody, true, 'response body does not contains a "query" field (simple, without a custom error handler)');
                        assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
                     }),

                     ttt.test('correct query', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/simple/query?name=xxx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, 'request with a correct query field is rejected (simple, without a custom error handler)');
                     }),
                  ]);
               }),

               tt.test('WITH a custom error handler', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('missing a required query param', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/simple/query`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 418, 'request with a missed required query param is not handled via custom handler (simple, with a custom error handler)');
                     }),

                     ttt.test('invalid query', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/simple/query?name=xx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 418, 'request with an invalid query field is not handled via custom handler (simple, with a custom error handler)');
                     }),

                     ttt.test('correct query', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/simple/query?name=xxx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, 'request with a correct query field is rejected (simple, with a custom error handler)');
                     }),
                  ]);
               }),
            ]);
         }),


         t.test('ParamsValidator', async (tt) =>
         {
            await Promise.all([
               tt.test('WITHOUT a custom error handler', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('invalid params', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/simple/params/xx`);
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with an invalid url pattern is not rejected (simple, without a custom error handler)');
                        assert.strictEqual('params' in parsedBody, true, 'response body does not contains a "params" field (simple, without a custom error handler)');
                        assert.strictEqual(typeof parsedBody?.params?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
                     }),

                     ttt.test('correct params', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/simple/params/xxx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, 'request with a correct params field is rejected (simple, without a custom error handler)');
                     }),
                  ]);
               }),

               tt.test('WITH a custom error handler', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('invalid params', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/simple/params/xx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 418, 'request with an invalid url pattern is not handled via custom handler (simple, with a custom error handler)');
                     }),

                     ttt.test('correct params', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/simple/params/xxx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, 'request with a correct params field is rejected (simple, with a custom error handler)');
                     }),
                  ]);
               }),
            ]);
         }),


         t.test('BodyValidator', async (tt) =>
         {
            await Promise.all([
               tt.test('WITHOUT a custom error handler', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('missing a required body field', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/simple/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with a missed required body field is not rejected (simple, without a custom error handler)');
                        assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field (simple, without a custom error handler)');
                        assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
                     }),

                     ttt.test('incomplete body', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/simple/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 5}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with an incomplete body is not rejected (simple, without a custom error handler)');
                        assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field (simple, without a custom error handler)');
                        assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
                     }),

                     ttt.test('broken body', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/simple/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: '{"name: 5}',
                        });
                        const parsedBody = await res.json();

                        assert.strictEqual(res.status, 500, 'runtime error (broken json parsing) is not catched (simple, without a custom error handler)');
                        assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (simple, without a custom error handler)');
                     }),

                     ttt.test('correct body', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/simple/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'xxx'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, 'request with a correct body is rejected (simple, without a custom error handler)');
                     }),
                  ]);
               }),

               tt.test('WITH a custom error handler', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('missing a required body field', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/simple/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 418, 'request with a missed required body field is not handled via custom handler (simple, with a custom error handler)');
                     }),

                     ttt.test('incomplete body', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/simple/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 5}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 418, 'request with an incomplete body is not handled via custom handler (simple, with a custom error handler)');
                     }),

                     ttt.test('broken body', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/simple/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: '{"name: 5}',
                        });
                        const parsedBody = await res.json();

                        assert.strictEqual(res.status, 500, 'runtime error (broken json parsing) is not catched (simple, with a custom error handler)');
                        assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (simple, with a custom error handler)');
                     }),

                     ttt.test('correct body', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/simple/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'xxx'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, 'request with a correct body is rejected (simple, with a custom error handler)');
                     }),
                  ]);
               }),
            ]);
         }),


         t.test('DefaultRequestValidator', async (tt) =>
         {
            await Promise.all([
               tt.test('QUERY (default)', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('missing a required query param (default)', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/query`);
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 422, '(default) request with a missed required query param is not rejected');
                        assert.strictEqual('query' in parsedBody, true, '(default) response body does not contains a "query" field');
                        assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', '(default) response body does not contains an error description');
                     }),

                     ttt.test('invalid query (default)', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/query?name=xx`);
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 422, '(default) request with an invalid query field is not rejected');
                        assert.strictEqual('query' in parsedBody, true, '(default) response body does not contains a "query" field');
                        assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', '(default) response body does not contains an error description');
                     }),

                     ttt.test('correct query (default)', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/query?name=xxx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, '(default) request with a correct query field is rejected');
                     }),
                  ]);
               }),

               tt.test('PARAMS (default)', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('invalid params (default)', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/params/xx`);
                        const parsedBody = await res.text();

                        assert.strictEqual(res.status, 404, '(default) request with an invalid url pattern is not rejected');
                        assert.strictEqual(parsedBody, 'Not Found', '(default) request with an invalid url pattern is not rejected');
                     }),

                     ttt.test('correct params (default)', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/params/xxx`);
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, '(default) request with a correct params field is rejected');
                     }),
                  ]);
               }),

               tt.test('BODY (default)', async (ttt) =>
               {
                  await Promise.all([
                     ttt.test('missing a required body field (default)', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 422, '(default) request with a missed required body field is not rejected');
                        assert.strictEqual('body' in parsedBody, true, '(default) response body does not contains a "body" field');
                        assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', '(default) response body does not contains an error description');
                     }),

                     ttt.test('incomplete body (default)', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 5}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 422, '(default) request with an incomplete body is not rejected');
                        assert.strictEqual('body' in parsedBody, true, '(default) response body does not contains a "body" field');
                        assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', '(default) response body does not contains an error description');
                     }),

                     ttt.test('broken body (default)', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: '{"name: 5}',
                        });
                        const parsedBody = await res.json();

                        assert.strictEqual(res.status, 500, '(default) runtime error (broken json parsing) is not catched');
                        assert.strictEqual(parsedBody?.type, 'entity.parse.failed', '(default) response body does not contains an error description');
                     }),

                     ttt.test('correct body (default)', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/body`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'xxx'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 200, '(default) request with a correct body is rejected');
                     }),
                  ]);
               }),
            ]);
         }),


         t.test('A believable case', async (tt) =>
         {
            const userId = crypto.randomUUID();

            await Promise.all([
               tt.test('Without anything', async (ttt) => {
                  await Promise.all([
                     ttt.test('invalid body and params for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/users/xx`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jh'}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with incorrect body and params is not rejected (user without anything)');
                        assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field (user without anything)');
                        assert.strictEqual('params' in parsedBody, true, 'response body does not contains a "params" field (user without anything)');
                        assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains a body error description (user without anything)');
                        assert.strictEqual(typeof parsedBody?.params?.[0]?.message, 'string', 'response body does not contains a params error description (user without anything)');
                     }),

                     ttt.test('invalid body for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/users/${userId}`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jh'}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with an incorrect body is not rejected (user without anything)');
                        assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field (user without anything)');
                        assert.strictEqual('params' in parsedBody, false, 'response body contains a "params" field in case of correct userId (user without anything)');
                        assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains a body error description (user without anything)');
                     }),

                     ttt.test('invalid params for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/users/xx`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jhon'}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 500, 'request with an incorrect params is not rejected (user without anything)');
                        assert.strictEqual('body' in parsedBody, false, 'response body does not contains a "body" field (user without anything)');
                        assert.strictEqual('params' in parsedBody, true, 'response body contains contains a "params" field in case of correct userId (user without anything)');
                        assert.strictEqual(typeof parsedBody?.params?.[0]?.message, 'string', 'response body does not contains a params error description (user without anything)');
                     }),

                     ttt.test('broken body for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/users/${userId}`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: '{"name: 5}',
                        });
                        const parsedBody = await res.json();

                        assert.strictEqual(res.status, 500, 'runtime error (broken json parsing) is not catched (user without anything)');
                        assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (user without anything)');
                     }),

                     ttt.test('correct user request', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/users/${userId}`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jhon'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 201, 'a correct user request is rejected (user without anything)');
                     }),
                  ]);
               }),

               tt.test('Custom error handler', async (ttt) => {
                  await Promise.all([
                     ttt.test('invalid body and params for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/users/xx`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jh'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 418, 'request with incorrect body and params is not rejected (custom error handler)');
                     }),

                     ttt.test('invalid body for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/users/${userId}`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jh'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 418, 'request with an incorrect body is not rejected (custom error handler)');
                     }),

                     ttt.test('invalid params for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/users/xx`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jhon'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 418, 'request with an incorrect params is not rejected (custom error handler)');
                     }),

                     ttt.test('broken body for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/users/${userId}`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: '{"name: 5}',
                        });
                        const parsedBody = await res.json();

                        assert.strictEqual(res.status, 500, 'runtime error (broken json parsing) is not catched (custom error handler)');
                        assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (custom error handler)');
                     }),

                     ttt.test('correct user request', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/custom/users/${userId}`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jhon'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 201, 'a correct user request is rejected (custom error handler)');
                     }),
                  ]);
               }),

               tt.test('Default error handler', async (ttt) => {
                  await Promise.all([
                     ttt.test('invalid body and params for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/users/xx`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jh'}),
                        });
                        const parsedBody = await res.text();

                        assert.strictEqual(res.status, 404, 'user request with an invalid url pattern and incorrect body is not rejected (default error handler)');
                        assert.strictEqual(parsedBody, 'Not Found', 'user request with an invalid url pattern and incorrect body is not rejected (default error handler)');
                     }),

                     ttt.test('invalid body for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/users/${userId}`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jh'}),
                        });
                        const parsedBody: IRequestValidationError = await res.json();

                        assert.strictEqual(res.status, 422, 'user request with an incorrect body is not rejected (default error handler)');
                        assert.strictEqual('body' in parsedBody, true, '(default) response body does not contains a "body" field');
                        assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', '(default) response body does not contains an error description');
                     }),

                     ttt.test('invalid params for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/users/xx`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jhon'}),
                        });
                        const parsedBody = await res.text();

                        assert.strictEqual(res.status, 404, 'user request with an invalid url pattern is not rejected (default error handler)');
                        assert.strictEqual(parsedBody, 'Not Found', 'user request with an invalid url pattern is not rejected (default error handler)');
                     }),

                     ttt.test('broken body for a user', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/users/${userId}`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: '{"name: 5}',
                        });
                        const parsedBody = await res.json();

                        assert.strictEqual(res.status, 500, 'runtime error (broken json parsing) is not catched (default error handler)');
                        assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (default error handler)');
                     }),

                     ttt.test('correct user request', async () => {
                        const res = await fetch(`http://localhost:${TEST_PORT}/default/users/${userId}`, {
                           method: 'POST',
                           headers: {
                           'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({name: 'Jhon'}),
                        });
                        await res.arrayBuffer();

                        assert.strictEqual(res.status, 201, 'a correct user request is rejected (default error handler)');
                     }),
                  ]);
               }),
            ]);
         }),
      ]);
   });

   await new Promise<void>((resolve, reject) => {
      server.close((err) => {
         err === undefined ? resolve() : reject(err);
      });
   });
});
