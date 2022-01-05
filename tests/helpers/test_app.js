exports.appFactory = (schema) =>
{
  const express = require('express');
  const app = express();
  const { RequestValidator } = require('../../dist');

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


  app.use((err, req, res, next) => {
    res.status(500).send(err);
  });



  return app;
};