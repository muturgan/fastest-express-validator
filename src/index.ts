import type { RequestHandler } from 'express';
import Validator, { ValidationSchema, ValidationError } from 'fastest-validator';
export { ValidationError } from 'fastest-validator';

type TValidationResult = true | ValidationError[];
type TCheckFunc = (value: any) => TValidationResult;


const v = new Validator();


export const DefaultRequestValidator = <B = any, P = any, Q = any>(schemas: {body?: ValidationSchema<B>, params?: ValidationSchema<P>, query?: ValidationSchema<Q>}): RequestHandler =>
{
   const {params, ...restSchemas} = schemas;

   const paramsCheckFunc = params !== undefined
      ? v.compile(params)
      : null;

   const restCheckFuncs: Array<{key: string, checkFunc: TCheckFunc}> = [];
   for (const key in restSchemas) {
      if (Boolean(restSchemas[key]) === true) {
         restCheckFuncs.push({
            key,
            checkFunc: v.compile(restSchemas[key]),
         });
      }
   }

   return (req, res, next): void =>
   {
      try {
         if (paramsCheckFunc !== null) {
            const paramsValidationResult = paramsCheckFunc(req.params);
            if (paramsValidationResult !== true) {
               res.sendStatus(404);
               return;
            }
         }

         const errors: {body?: ValidationError[], query?: ValidationError[]} = {};

         restCheckFuncs.forEach(({key, checkFunc}) => {
            const result = checkFunc(req[key]);
            if (result !== true) {
               errors[key] = result;
            }
         });

         if (Object.keys(errors).length > 0) {
            res.status(422).send(errors);
            return;
         }

         next();

      } catch (err) {
         next(err);
      }
   };
};


export const RequestValidator = <B = any, P = any, Q = any>(schemas: {body?: ValidationSchema<B>, params?: ValidationSchema<P>, query?: ValidationSchema<Q>}): RequestHandler =>
{
   const checkFuncs: Array<{key: string, checkFunc: TCheckFunc}> = [];

   for (const key in schemas) {
      if (Boolean(schemas[key]) === true) {
         checkFuncs.push({
            key,
            checkFunc: v.compile(schemas[key]),
         });
      }
   }

   return (req, _res, next): void =>
   {
      try {
         const errors: {body?: ValidationError[], params?: ValidationError[], query?: ValidationError[]} = {};

         checkFuncs.forEach(({key, checkFunc}) => {
            const result = checkFunc(req[key]);
            if (result !== true) {
               errors[key] = result;
            }
         });

         if (Object.keys(errors).length > 0) {
            next(errors);
            return;
         }

         next();

      } catch (err) {
         next(err);
      }
   };
};