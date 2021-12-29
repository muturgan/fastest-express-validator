import { RequestHandler } from 'express';
import Validator, { ValidationSchema, ValidationError, SyncCheckFunction, AsyncCheckFunction } from 'fastest-validator';
export { ValidationError } from 'fastest-validator';

type TCheckFunc = SyncCheckFunction | AsyncCheckFunction;


const v = new Validator();


export const DefaultRequestValidator = <B = any, Q = any, P = any, >(schemas: {body?: ValidationSchema<B>, query?: ValidationSchema<Q>, params?: ValidationSchema<P>}): RequestHandler =>
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

   return async (req, res, next): Promise<void> =>
   {
      try {
         if (paramsCheckFunc !== null) {
            const paramsValidationResult = await paramsCheckFunc(req.params);
            if (paramsValidationResult !== true) {
               res.sendStatus(404);
               return;
            }
         }

         const errors: {body?: ValidationError[], query?: ValidationError[]} = {};

         for (const {key, checkFunc} of restCheckFuncs) {
            const result = await checkFunc(req[key]);
            if (result !== true) {
               errors[key] = result;
            }
         }

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


export const RequestValidator = <B = any, Q = any, P = any>(schemas: {body?: ValidationSchema<B>, query?: ValidationSchema<Q>, params?: ValidationSchema<P>}): RequestHandler =>
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

   return async (req, _res, next): Promise<void> =>
   {
      try {
         const errors: {body?: ValidationError[], params?: ValidationError[], query?: ValidationError[]} = {};

         for (const {key, checkFunc} of checkFuncs) {
            const result = await checkFunc(req[key]);
            if (result !== true) {
               errors[key] = result;
            }
         }

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