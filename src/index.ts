import type { RequestHandler } from 'express';
import Validator, { ValidationSchema, ValidationError } from 'fastest-validator';


const v = new Validator();


export const DefaultRequestValidator = <B = any, P = any, Q = any>(schemas: {body?: ValidationSchema<B>, params?: ValidationSchema<P>, query?: ValidationSchema<Q>}): RequestHandler =>
{
   return (req, res, next): void =>
   {
      try {
         const {params, ...restSchemas} = schemas;

         if (params !== undefined) {
            const paramsValidationResult = v.validate(req.params, params);
            if (paramsValidationResult !== true) {
               res.sendStatus(404);
               return;
            }
         }

         const errors: {body?: ValidationError[], query?: ValidationError[]} = {};

         for (const key in restSchemas) {
            if (Boolean(restSchemas[key]) === true) {
               const result = v.validate(req[key], restSchemas[key]);
               if (result !== true) {
                  errors[key] = result;
               }
            }
         }

         if (Object.keys(errors).length > 0) {
            res.status(422).send(errors);
         }

         next();

      } catch (err) {
         next(err);
      }
   };
};


export const RequestValidator = <B = any, P = any, Q = any>(schemas: {body?: ValidationSchema<B>, params?: ValidationSchema<P>, query?: ValidationSchema<Q>}): RequestHandler =>
{
   return (req, _res, next): void =>
   {
      try {
         let errors: ValidationError[] = [];

         for (const key in schemas) {
            if (Boolean(schemas[key]) === true) {
               const result = v.validate(req[key], schemas[key]);
               if (result !== true) {
                  errors = errors.concat(result);
               }
            }
         }

         if (errors.length > 0) {
            next(errors);
         }

         next();

      } catch (err) {
         next(err);
      }
   };
};