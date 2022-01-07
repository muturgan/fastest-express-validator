import express = require('express');
import { ValidationSchema } from 'fastest-validator';
import { RequestValidator, DefaultRequestValidator } from '../../index';

export const appFactory = (schema: ValidationSchema<{name: string}>) =>
{
   const app = express();
   app.use(express.json());



   const queryValidationMiddleware = RequestValidator({
      query: schema,
   });
   app.get('/query', queryValidationMiddleware, (req, res) => {
      const status = req.query.name ? 200 : 500;
      res.sendStatus(status);
   });


   const paramsValidationMiddleware = RequestValidator({
      params: schema,
   });
   app.get('/params/:name', paramsValidationMiddleware, (req, res) => {
      const status = req.params.name ? 200 : 500;
      res.sendStatus(status);
   });


   const bodyValidationMiddleware = RequestValidator({
      body: schema,
   });
   app.post('/body', bodyValidationMiddleware, (req, res) => {
      const status = req.body.name ? 200 : 500;
      res.sendStatus(status);
   });



   const defaultQueryValidationMiddleware = DefaultRequestValidator({
      query: schema,
   });
   app.get('/default/query', defaultQueryValidationMiddleware, (req, res) => {
      const status = req.query.name ? 200 : 500;
      res.sendStatus(status);
   });

   const defaultParamsValidationMiddleware = DefaultRequestValidator({
      params: schema,
   });
   app.get('/default/params/:name', defaultParamsValidationMiddleware, (req, res) => {
      const status = req.params.name ? 200 : 500;
      res.sendStatus(status);
   });

   const defaultBodyValidationMiddleware = DefaultRequestValidator({
      body: schema,
   });
   app.post('/default/body', defaultBodyValidationMiddleware, (req, res) => {
      const status = req.body.name ? 200 : 500;
      res.sendStatus(status);
   });



   app.use((err, _req, res, _next) => {
      res.status(500).send(err);
   });



   return app;
};