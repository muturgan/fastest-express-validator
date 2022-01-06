import { RequestHandler, Request, Response, NextFunction } from 'express';
import Validator, { ValidationSchema, ValidationError, SyncCheckFunction, AsyncCheckFunction } from 'fastest-validator';
export { ValidationError } from 'fastest-validator';

type TCheckFunc = SyncCheckFunction | AsyncCheckFunction;

export interface IRequestValidationSchema<B = any, Q = any, P = any, > {
   body?: ValidationSchema<B>;
   query?: ValidationSchema<Q>;
   params?: ValidationSchema<P>;
}

export interface IRequestValidationError {
   body?: ValidationError[];
   params?: ValidationError[];
   query?: ValidationError[];
}

export type TValidationErrorHandler = (errors: IRequestValidationError, req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export type TRequestValidator<B = any, Q = any, P = any> = (schemas: IRequestValidationSchema<B, Q, P>, errorHandler?: TValidationErrorHandler | null) => RequestHandler;


const v = new Validator();


export const RequestValidator = <B = any, Q = any, P = any>(schemas: IRequestValidationSchema<B, Q, P>, errorHandler?: TValidationErrorHandler | null): RequestHandler =>
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

   return async (req, res, next): Promise<void> =>
   {
      try {
         const errors: IRequestValidationError = {};

         for (const {key, checkFunc} of checkFuncs) {
            const result = await checkFunc(req[key]);
            if (result !== true) {
               errors[key] = result;
            }
         }

         if (Object.keys(errors).length > 0) {
            if (typeof errorHandler === 'function') {
               errorHandler(errors, req, res, next);
            } else {
               next(errors);
            }
            return;
         }

         next();

      } catch (err) {
         next(err);
      }
   };
};


const defaultRequestValidatorHandler: TValidationErrorHandler = (mayBeErrors, _req, res, next) => {
   const errors = typeof mayBeErrors === 'object' && Array.isArray(mayBeErrors) === false && mayBeErrors !== null
      ? mayBeErrors
      : {};

   if (Object.keys(errors).length === 0) {
      next();
      return;
   }

   const paramsValidationErrors = errors?.params;
   if (Array.isArray(paramsValidationErrors) && paramsValidationErrors.length > 0) {
      res.sendStatus(404);
      return;
   }

   if ((Array.isArray(errors?.query) && errors.query.length > 0) || (Array.isArray(errors?.body) && errors.body.length > 0)) {
      res.status(422).send(errors);
      return;
   }

   next(mayBeErrors);
};


export const DefaultRequestValidator = <B = any, Q = any, P = any>(schemas: IRequestValidationSchema<B, Q, P>) => {
   return RequestValidator(schemas, defaultRequestValidatorHandler);
};