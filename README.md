# fastest-express-validator
![NPM Version Badge](https://img.shields.io/npm/v/fastest-express-validator?logo=npm)
<a href="https://github.com/muturgan/fastest-express-validator/actions/workflows/main.yml" target="_blank"><img src="https://img.shields.io/github/actions/workflow/status/muturgan/fastest-express-validator/main.yml?branch=master&logo=github" alt="CI Build Badge" /></a>
[![Hits-of-Code](https://hitsofcode.com/github/muturgan/fastest-express-validator)](https://hitsofcode.com/view/github/muturgan/fastest-express-validator)
![Coverage Badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/muturgan/c7b1c29d6e20c66c9c38971617b3865c/raw/fev_coverage.json)
![License Badge](https://img.shields.io/npm/l/fastest-express-validator)

request validation middleware for [express][express]
based on [fastest-validator][fastest-validator]

[express]: https://expressjs.com
[fastest-validator]: https://github.com/icebob/fastest-validator

## Example
``` js
const app = require('express')();
const {
    RequestValidator,
    QueryValidator,
    DefaultRequestValidator,
} = require('fastest-express-validator');

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

const fastMiddleware = RequestValidator(
    { query: querySchema },
    null, // define a custom error handler if you want to

    /* you can pass some options for a fastest-validator instance
    it should implements a ValidatorConstructorOptions interface
    note that this package set a "useNewCustomCheckerFunction" option in true by default
    so you should override it to use a v1 syntax for built-in rules */
    { haltOnFirstError: true }
);

// also this package provides BodyValidator and ParamsValidator short validators
const shortQueryMiddleware = QueryValidator(
    querySchema,
    // also you can pass a custom error handler in a second argument,
    // also you can pass a ValidatorConstructorOptions in a third argument
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

app.get('/fast', fastMiddleware, (req, res) => {
    console.log('a query object at the fast route is:');
    console.log(req.query);
    res.send('It was fast');
});

app.get('/short', shortQueryMiddleware, (req, res) => {
    console.log('a query object at the short route is:');
    console.log(req.query);
    res.send('Hello Short');
});

// This middleware already have a default validation error handling behaviour -
// send 404 on params validation error
// and 422 (with error details at response body) on query and body validation error.
const defaultQueryValidationMiddleware = DefaultRequestValidator(
    { query: schema /* body, params */ },
    // you can pass a ValidatorConstructorOptions here
);
app.get('/default', defaultQueryValidationMiddleware, (req, res) => {
    console.log('a query object at the default route is:');
    console.log(req.query);
    res.send('Hello Default');
});

app.use((err, req, res, next) => {
    console.log('OMG!');
    console.error(err);
    res.status(500).send('Something broke!');
});

app.listen(2023, () => console.log('check it on http://localhost:2023?name=one'));
```
