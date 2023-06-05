import express = require('express');
import { ValidationSchema } from 'fastest-validator';
import { RequestValidator, DefaultRequestValidator, QueryValidator, ParamsValidator, BodyValidator, TValidationErrorHandler, IRequestValidationSchema } from '../../index';

export const appFactory = (schema: ValidationSchema<{name: string}>, userSchema: IRequestValidationSchema</*Body*/{name: string}, {}, /*Params*/{userId: string}>) =>
{
   const app = express();
   app.use(express.json());

   const customSimpleErrorHandler: TValidationErrorHandler = (_errors, _req, res, _next) => {
      res.sendStatus(418);
   };



   const queryValidationMiddleware = RequestValidator({
      query: schema,
   });
   app.get('/query', queryValidationMiddleware, (req, res) => {
      const status = req.query.name ? 200 : 500;
      res.sendStatus(status);
   });

   const simpleQueryValidationMiddleware = QueryValidator(schema);
   app.get('/simple/query', simpleQueryValidationMiddleware, (req, res) => {
      const status = req.query.name ? 200 : 500;
      res.sendStatus(status);
   });

   const customSimpleQueryValidationMiddleware = QueryValidator(schema, customSimpleErrorHandler);
   app.get('/custom/simple/query', customSimpleQueryValidationMiddleware, (req, res) => {
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

   const simpleParamsValidationMiddleware = ParamsValidator(schema);
   app.get('/simple/params/:name', simpleParamsValidationMiddleware, (req, res) => {
      const status = req.params.name ? 200 : 500;
      res.sendStatus(status);
   });

   const customSimpleParamsValidationMiddleware = ParamsValidator(schema, customSimpleErrorHandler);
   app.get('/custom/simple/params/:name', customSimpleParamsValidationMiddleware, (req, res) => {
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

   const simpleBodyValidationMiddleware = BodyValidator(schema);
   app.post('/simple/body', simpleBodyValidationMiddleware, (req, res) => {
      const status = req.body.name ? 200 : 500;
      res.sendStatus(status);
   });

   const customSimpleBodyValidationMiddleware = BodyValidator(schema, customSimpleErrorHandler);
   app.post('/custom/simple/body', customSimpleBodyValidationMiddleware, (req, res) => {
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



   const userValidationMiddleware = RequestValidator(userSchema);
   app.post('/users/:userId', userValidationMiddleware, (req, res) => {
      const status = req.body.name && req.params.userId ? 201 : 500;
      res.sendStatus(status);
   });

   const customUserValidationMiddleware = RequestValidator(userSchema, customSimpleErrorHandler);
   app.post('/custom/users/:userId', customUserValidationMiddleware, (req, res) => {
      const status = req.body.name && req.params.userId ? 201 : 500;
      res.sendStatus(status);
   });

   const defaultValidationMiddleware = DefaultRequestValidator(userSchema);
   app.post('/default/users/:userId', defaultValidationMiddleware, (req, res) => {
      const status = req.body.name && req.params.userId ? 201 : 500;
      res.sendStatus(status);
   });



   const readmeValidationMiddleware = RequestValidator(
      {query: schema},
      null,
      {haltOnFirstError: true},
   );
   app.get('/readme', readmeValidationMiddleware, (req, res) => {
      const status = req.query.name ? 200 : 500;
      res.sendStatus(status);
   });



   app.use((err, _req, res, _next) => {
      res.status(500).send(err);
   });



   return app;
};
