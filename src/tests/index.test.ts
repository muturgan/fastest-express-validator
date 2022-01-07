import assert = require('assert');
import crypto = require('crypto');
import undici = require('undici');
import helpers = require('./helpers/test_app');
import { ValidationSchema } from 'fastest-validator';
import { IRequestValidationSchema, IRequestValidationError } from '../index';

const fetch = undici.request;

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
   describe('fastest-express-validator', () =>
   {
      describe('RequestValidator', () =>
      {
         describe('QUERY', () =>
         {
            it('missing a required query param', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/query`);
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with a missed required query param is not rejected');
               assert.strictEqual('query' in parsedBody, true, 'response body does not contains a "query" field');
               assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', 'response body does not contains an error description');
            });

            it('invalid query', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/query?name=xx`);
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with an invalid query field is not rejected');
               assert.strictEqual('query' in parsedBody, true, 'response body does not contains a "query" field');
               assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', 'response body does not contains an error description');
            });

            it('correct query', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/query?name=xxx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, 'request with a correct query field is rejected');
            });
         });

         describe('PARAMS', () =>
         {
            it('invalid params', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/params/xx`);
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with an invalid url pattern is not rejected');
               assert.strictEqual('params' in parsedBody, true, 'response body does not contains a "params" field');
               assert.strictEqual(typeof parsedBody?.params?.[0]?.message, 'string', 'response body does not contains an error description');
            });

            it('correct params', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/params/xxx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, 'request with a correct params field is rejected');
            });
         });

         describe('BODY', () =>
         {
            it('missing a required body field', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with a missed required body field is not rejected');
               assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field');
               assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains an error description');
            });

            it('incomplete body', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 5}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with an incomplete body is not rejected');
               assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field');
               assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains an error description');
            });

            it('broken body', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: '{"name: 5}',
               });
               const parsedBody = await body.json();

               assert.strictEqual(statusCode, 500, 'runtime error (broken json parsing) is not catched');
               assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description');
            });

            it('correct body', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'xxx'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, 'request with a correct body is rejected');
            });
         });
      });


      describe('QueryValidator', () =>
      {
         describe('WITHOUT a custom error handler', () =>
         {
            it('missing a required query param', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/simple/query`);
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with a missed required query param is not rejected (simple, without a custom error handler)');
               assert.strictEqual('query' in parsedBody, true, 'response body does not contains a "query" field (simple, without a custom error handler)');
               assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
            });

            it('invalid query', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/simple/query?name=xx`);
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with an invalid query field is not rejected (simple, without a custom error handler)');
               assert.strictEqual('query' in parsedBody, true, 'response body does not contains a "query" field (simple, without a custom error handler)');
               assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
            });

            it('correct query', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/simple/query?name=xxx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, 'request with a correct query field is rejected (simple, without a custom error handler)');
            });
         });

         describe('WITH a custom error handler', () =>
         {
            it('missing a required query param', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/simple/query`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 418, 'request with a missed required query param is not handled via custom handler (simple, with a custom error handler)');
            });

            it('invalid query', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/simple/query?name=xx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 418, 'request with an invalid query field is not handled via custom handler (simple, with a custom error handler)');
            });

            it('correct query', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/simple/query?name=xxx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, 'request with a correct query field is rejected (simple, with a custom error handler)');
            });
         });
      });


      describe('ParamsValidator', () =>
      {
         describe('WITHOUT a custom error handler', () =>
         {
            it('invalid params', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/simple/params/xx`);
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with an invalid url pattern is not rejected (simple, without a custom error handler)');
               assert.strictEqual('params' in parsedBody, true, 'response body does not contains a "params" field (simple, without a custom error handler)');
               assert.strictEqual(typeof parsedBody?.params?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
            });

            it('correct params', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/simple/params/xxx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, 'request with a correct params field is rejected (simple, without a custom error handler)');
            });
         });

         describe('WITH a custom error handler', () =>
         {
            it('invalid params', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/simple/params/xx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 418, 'request with an invalid url pattern is not handled via custom handler (simple, with a custom error handler)');
            });

            it('correct params', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/simple/params/xxx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, 'request with a correct params field is rejected (simple, with a custom error handler)');
            });
         });
      });


      describe('BodyValidator', () =>
      {
         describe('WITHOUT a custom error handler', () =>
         {
            it('missing a required body field', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/simple/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with a missed required body field is not rejected (simple, without a custom error handler)');
               assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field (simple, without a custom error handler)');
               assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
            });

            it('incomplete body', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/simple/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 5}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with an incomplete body is not rejected (simple, without a custom error handler)');
               assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field (simple, without a custom error handler)');
               assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains an error description (simple, without a custom error handler)');
            });

            it('broken body', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/simple/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: '{"name: 5}',
               });
               const parsedBody = await body.json();

               assert.strictEqual(statusCode, 500, 'runtime error (broken json parsing) is not catched (simple, without a custom error handler)');
               assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (simple, without a custom error handler)');
            });

            it('correct body', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/simple/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'xxx'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, 'request with a correct body is rejected (simple, without a custom error handler)');
            });
         });

         describe('WITH a custom error handler', () =>
         {
            it('missing a required body field', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/simple/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 418, 'request with a missed required body field is not handled via custom handler (simple, with a custom error handler)');
            });

            it('incomplete body', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/simple/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 5}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 418, 'request with an incomplete body is not handled via custom handler (simple, with a custom error handler)');
            });

            it('broken body', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/simple/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: '{"name: 5}',
               });
               const parsedBody = await body.json();

               assert.strictEqual(statusCode, 500, 'runtime error (broken json parsing) is not catched (simple, with a custom error handler)');
               assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (simple, with a custom error handler)');
            });

            it('correct body', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/simple/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'xxx'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, 'request with a correct body is rejected (simple, with a custom error handler)');
            });
         });
      });


      describe('DefaultRequestValidator', () =>
      {
         describe('QUERY (default)', () =>
         {
            it('missing a required query param (default)', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/query`);
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 422, '(default) request with a missed required query param is not rejected');
               assert.strictEqual('query' in parsedBody, true, '(default) response body does not contains a "query" field');
               assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', '(default) response body does not contains an error description');
            });

            it('invalid query (default)', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/query?name=xx`);
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 422, '(default) request with an invalid query field is not rejected');
               assert.strictEqual('query' in parsedBody, true, '(default) response body does not contains a "query" field');
               assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', '(default) response body does not contains an error description');
            });

            it('correct query (default)', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/query?name=xxx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, '(default) request with a correct query field is rejected');
            });
         });

         describe('PARAMS (default)', () =>
         {
            it('invalid params (default)', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/params/xx`);
               const parsedBody = await body.text();

               assert.strictEqual(statusCode, 404, '(default) request with an invalid url pattern is not rejected');
               assert.strictEqual(parsedBody, 'Not Found', '(default) request with an invalid url pattern is not rejected');
            });

            it('correct params (default)', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/params/xxx`);
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, '(default) request with a correct params field is rejected');
            });
         });

         describe('BODY (default)', () =>
         {
            it('missing a required body field (default)', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 422, '(default) request with a missed required body field is not rejected');
               assert.strictEqual('body' in parsedBody, true, '(default) response body does not contains a "body" field');
               assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', '(default) response body does not contains an error description');
            });

            it('incomplete body (default)', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 5}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 422, '(default) request with an incomplete body is not rejected');
               assert.strictEqual('body' in parsedBody, true, '(default) response body does not contains a "body" field');
               assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', '(default) response body does not contains an error description');
            });

            it('broken body (default)', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: '{"name: 5}',
               });
               const parsedBody = await body.json();

               assert.strictEqual(statusCode, 500, '(default) runtime error (broken json parsing) is not catched');
               assert.strictEqual(parsedBody?.type, 'entity.parse.failed', '(default) response body does not contains an error description');
            });

            it('correct body (default)', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/body`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'xxx'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 200, '(default) request with a correct body is rejected');
            });
         });
      });


      describe('A believable case', () =>
      {
         const userId = crypto.randomUUID();

         describe('Without anything', () => {
            it('invalid body and params for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/users/xx`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jh'}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with incorrect body and params is not rejected (user without anything)');
               assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field (user without anything)');
               assert.strictEqual('params' in parsedBody, true, 'response body does not contains a "params" field (user without anything)');
               assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains a body error description (user without anything)');
               assert.strictEqual(typeof parsedBody?.params?.[0]?.message, 'string', 'response body does not contains a params error description (user without anything)');
            });

            it('invalid body for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/users/${userId}`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jh'}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with an incorrect body is not rejected (user without anything)');
               assert.strictEqual('body' in parsedBody, true, 'response body does not contains a "body" field (user without anything)');
               assert.strictEqual('params' in parsedBody, false, 'response body contains a "params" field in case of correct userId (user without anything)');
               assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', 'response body does not contains a body error description (user without anything)');
            });

            it('invalid params for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/users/xx`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jhon'}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 500, 'request with an incorrect params is not rejected (user without anything)');
               assert.strictEqual('body' in parsedBody, false, 'response body does not contains a "body" field (user without anything)');
               assert.strictEqual('params' in parsedBody, true, 'response body contains contains a "params" field in case of correct userId (user without anything)');
               assert.strictEqual(typeof parsedBody?.params?.[0]?.message, 'string', 'response body does not contains a params error description (user without anything)');
            });

            it('broken body for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/users/${userId}`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: '{"name: 5}',
               });
               const parsedBody = await body.json();

               assert.strictEqual(statusCode, 500, 'runtime error (broken json parsing) is not catched (user without anything)');
               assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (user without anything)');
            });

            it('correct user request', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/users/${userId}`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jhon'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 201, 'a correct user request is rejected (user without anything)');
            });
         });

         describe('Custom error handler', () => {
            it('invalid body and params for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/users/xx`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jh'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 418, 'request with incorrect body and params is not rejected (custom error handler)');
            });

            it('invalid body for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/users/${userId}`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jh'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 418, 'request with an incorrect body is not rejected (custom error handler)');
            });

            it('invalid params for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/users/xx`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jhon'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 418, 'request with an incorrect params is not rejected (custom error handler)');
            });

            it('broken body for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/users/${userId}`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: '{"name: 5}',
               });
               const parsedBody = await body.json();

               assert.strictEqual(statusCode, 500, 'runtime error (broken json parsing) is not catched (custom error handler)');
               assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (custom error handler)');
            });

            it('correct user request', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/custom/users/${userId}`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jhon'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 201, 'a correct user request is rejected (custom error handler)');
            });
         });

         describe('Default error handler', () => {
            it('invalid body and params for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/users/xx`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jh'}),
               });
               const parsedBody = await body.text();

               assert.strictEqual(statusCode, 404, 'user request with an invalid url pattern and incorrect body is not rejected (default error handler)');
               assert.strictEqual(parsedBody, 'Not Found', 'user request with an invalid url pattern and incorrect body is not rejected (default error handler)');
            });

            it('invalid body for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/users/${userId}`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jh'}),
               });
               const parsedBody: IRequestValidationError = await body.json();

               assert.strictEqual(statusCode, 422, 'user request with an incorrect body is not rejected (default error handler)');
               assert.strictEqual('body' in parsedBody, true, '(default) response body does not contains a "body" field');
               assert.strictEqual(typeof parsedBody?.body?.[0]?.message, 'string', '(default) response body does not contains an error description');
            });

            it('invalid params for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/users/xx`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jhon'}),
               });
               const parsedBody = await body.text();

               assert.strictEqual(statusCode, 404, 'user request with an invalid url pattern is not rejected (default error handler)');
               assert.strictEqual(parsedBody, 'Not Found', 'user request with an invalid url pattern is not rejected (default error handler)');
            });

            it('broken body for a user', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/users/${userId}`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: '{"name: 5}',
               });
               const parsedBody = await body.json();

               assert.strictEqual(statusCode, 500, 'runtime error (broken json parsing) is not catched (default error handler)');
               assert.strictEqual(parsedBody?.type, 'entity.parse.failed', 'response body does not contains an error description (default error handler)');
            });

            it('correct user request', async () => {
               const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/users/${userId}`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({name: 'Jhon'}),
               });
               for await (const _ of body) {
                  // force consumption of body for a memory leak preventing
               }

               assert.strictEqual(statusCode, 201, 'a correct user request is rejected (default error handler)');
            });
         });
      });


      after(() => {
         return new Promise<void>((resolve, reject) => {
            server.close((err) => {
               err === undefined ? resolve() : reject(err);
            });
         });
      });

   });
});
