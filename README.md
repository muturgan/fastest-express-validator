# fastest-express-validator
![NPM Version Badge](https://img.shields.io/npm/v/fastest-express-validator?logo=npm)
![Build Badge](https://img.shields.io/github/workflow/status/muturgan/fastest-express-validator/npm-publish?logo=github)
![Coverage Badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/muturgan/c7b1c29d6e20c66c9c38971617b3865c/raw/fev_coverage.json)
![License Badge](https://img.shields.io/npm/l/fastest-express-validator)

request validation middleware for [express][express]
based on [fastest-validator][fastest-validator]

[express]: https://expressjs.com
[fastest-validator]: https://github.com/icebob/fastest-validator

## Example
``` js
const app = require('express')();
const { RequestValidator, QueryValidator } = require('fastest-express-validator');

const querySchema = {
    name: { type: "string", min: 3, max: 255 },
};

const customErrorHandler = (err, req, res, next) => {
    console.log('error at the customErrorHandler:');
    console.log(err);
    res.sendStatus(418);
}

const validationMiddleware = RequestValidator({
    // also you can pass the "body" and "params" fields
    query: querySchema,
});

const middlewareWithCustomHandler = RequestValidator(
    { query: querySchema },
    customErrorHandler,
);

// also this package provides BodyValidator and ParamsValidator short validators
const shortQueryMiddleware = QueryValidator(
    querySchema,
    // also you can pass a custom error handler in a second argument
);

app.get('/', validationMiddleware, (req, res) => {
    console.log('a query object is:');
    console.log(req.query);
    res.send('Hello World');
});

app.get('/custom', middlewareWithCustomHandler, (req, res) => {
    console.log('a query object at the custom route is:');
    console.log(req.query);
    res.send('Hello Custom');
});

app.get('/short', shortQueryMiddleware, (req, res) => {
    console.log('a query object at the custom route is:');
    console.log(req.query);
    res.send('Hello Custom');
});

app.use((err, req, res, next) => {
    console.log('OMG!');
    console.error(err);
    res.status(500).send('Something broke!');
});

app.listen(3000, () => console.log('check it on http://localhost:3000?name=one'));
```

Also this package exports a **DefaultRequestValidator** function. It already have a default validation error handling behaviour - send 404 on params validation error and 422 (with error details at response body) on query and body validation error.