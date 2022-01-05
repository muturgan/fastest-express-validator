const assert = require('assert');
const { request: fetch } = require('undici');
const { appFactory } = require('./helpers/test_app');

const schema = {
  name: { type: "string", min: 3, max: 255 },
};
const app = appFactory(schema);

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
          const parsedBody = await body.json();

          assert.strictEqual(statusCode, 500, 'request with a missed required query param is not rejected');
          assert.strictEqual('query' in parsedBody, true, 'response body does not contains a "query" field');
          assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', 'response body does not contains an error description');
        });

        it('invalid query', async () => {
          const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/query?name=xx`);
          const parsedBody = await body.json();

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
          const parsedBody = await body.json();

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
          const parsedBody = await body.json();

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
          const parsedBody = await body.json();

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


    describe('DefaultRequestValidator', () =>
    {
      describe('QUERY (default)', () =>
      {
        it('missing a required query param', async () => {
          const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/query`);
          const parsedBody = await body.json();

          assert.strictEqual(statusCode, 422, '(default) request with a missed required query param is not rejected');
          assert.strictEqual('query' in parsedBody, true, '(default) response body does not contains a "query" field');
          assert.strictEqual(typeof parsedBody?.query?.[0]?.message, 'string', '(default) response body does not contains an error description');
        });

        it('invalid query (default)', async () => {
          const {statusCode, body} = await fetch(`http://localhost:${TEST_PORT}/default/query?name=xx`);
          const parsedBody = await body.json();

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
          const parsedBody = await body.json();

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
          const parsedBody = await body.json();

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


    after(() => {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          err === undefined ? resolve() : reject(err);
        });
      });
    });

  });
});
