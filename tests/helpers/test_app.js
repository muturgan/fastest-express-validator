exports.appFactory = (schema) =>
{
  const express = require('express');
  const app = express();
  const { RequestValidator, DefaultRequestValidator } = require('../../dist/index.cjs');

  app.use(express.json());



  const queryValidationMiddleware = RequestValidator({
    query: schema,
  });
  app.get('/query', queryValidationMiddleware, (req, res) => {
    res.sendStatus(200);
  });


  const paramsValidationMiddleware = RequestValidator({
    params: schema,
  });
  app.get('/params/:name', paramsValidationMiddleware, (req, res) => {
    res.sendStatus(200);
  });


  const bodyValidationMiddleware = RequestValidator({
    body: schema,
  });
  app.post('/body', bodyValidationMiddleware, (req, res) => {
    res.sendStatus(200);
  });



  const defaultQueryValidationMiddleware = DefaultRequestValidator({
    query: schema,
  });
  app.get('/default/query', defaultQueryValidationMiddleware, (req, res) => {
    res.sendStatus(200);
  });

  const defaultParamsValidationMiddleware = DefaultRequestValidator({
    params: schema,
  });
  app.get('/default/params/:name', defaultParamsValidationMiddleware, (req, res) => {
    res.sendStatus(200);
  });

  const defaultBodyValidationMiddleware = DefaultRequestValidator({
    body: schema,
  });
  app.post('/default/body', defaultBodyValidationMiddleware, (req, res) => {
    res.sendStatus(200);
  });



  app.use((err, req, res, next) => {
    res.status(500).send(err);
  });



  return app;
};