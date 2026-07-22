# fastest-express-validator
![NPM Version Badge](https://img.shields.io/npm/v/fastest-express-validator?logo=npm)
<a href="https://github.com/muturgan/fastest-express-validator/actions/workflows/main.yml" target="_blank"><img src="https://img.shields.io/github/actions/workflow/status/muturgan/fastest-express-validator/main.yml?branch=master&logo=github" alt="CI Build Badge" /></a>
[![Hits-of-Code](https://hitsofcode.com/github/muturgan/fastest-express-validator?exclude=package-lock.json)](https://hitsofcode.com/github/muturgan/fastest-express-validator/view?exclude=package-lock.json)
![Coverage Badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/muturgan/c7b1c29d6e20c66c9c38971617b3865c/raw/fev_coverage.json)
![License Badge](https://img.shields.io/npm/l/fastest-express-validator)

Request validation middleware for [express][express]
based on [fastest-validator][fastest-validator] (tested with both express v4 and v5).

Supports both CommonJS (`require`) and ES modules (`import`).

[express]: https://expressjs.com
[fastest-validator]: https://github.com/icebob/fastest-validator

## CommonJS
``` js
const express = require('express');
const {
    RequestValidator,
    QueryValidator,
    DefaultRequestValidator,
} = require('fastest-express-validator');
```

## ES Modules
``` js
import express from 'express';
import {
    RequestValidator,
    QueryValidator,
    DefaultRequestValidator,
} from 'fastest-express-validator';
```

## Example
``` js
const app = express();

const querySchema = {
    name: { type: "string", min: 3, max: 255 },
};

const customErrorHandler = (err, req, res, next) => {
    console.log('error at the customErrorHandler:');
    console.log(err);
    res.sendStatus(418);
}

const validationMiddleware = RequestValidator({
    // you can also pass the "body" and "params" fields
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
    it should implement the ValidatorConstructorOptions interface
    note that this package sets the "useNewCustomCheckerFunction" option to True by default
    so you should override it to use the v1 syntax for built-in rules */
    { haltOnFirstError: true }
);

// this package also provides BodyValidator and ParamsValidator short validators
const shortQueryMiddleware = QueryValidator(
    querySchema,
    // you can also pass a custom error handler as the second argument,
    // and a ValidatorConstructorOptions as the third argument
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

// This middleware already has a default validation error handling behaviour —
// sends a 404 on params validation errors
// and 422 (with error details in the response body) on query and body validation errors.
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

app.listen(2026, () => console.log('check it on http://localhost:2026?name=one'));
```
