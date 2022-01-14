import { RequestHandler, Request, Response, NextFunction } from 'express';
import Validator, { ValidationSchema, ValidationError, SyncCheckFunction, AsyncCheckFunction } from 'fastest-validator';
export { ValidationError } from 'fastest-validator';

type TCheckFunc = SyncCheckFunction | AsyncCheckFunction;

export interface IRequestValidationSchema<B extends Record<string, unknown> = {}, Q extends Record<string, string> = {}, P extends Record<string, string> = {}, > {
   body?: ValidationSchema<B>;
   query?: ValidationSchema<Q>;
   params?: ValidationSchema<P>;
}

export interface IRequestValidationError {
   body?: ValidationError[];
   params?: ValidationError[];
   query?: ValidationError[];
}

export interface IBodyValidationError {
   body: ValidationError[];
}

export interface IQueryValidationError {
   query: ValidationError[];
}

export interface IParamsValidationError {
   params: ValidationError[];
}

export type TValidationErrorHandler<B extends Record<string, unknown> = {}, Q extends Record<string, string> = {}, P extends Record<string, string> = {}, ResBody = any, L extends Record<string, unknown> = {}> = (errors: IRequestValidationError, req: Request<P, ResBody, B, Q, L>, res: Response<ResBody, L>, next: NextFunction) => void | Promise<void>;
export type TBodyValidationErrorHandler<B extends Record<string, unknown>  = {}, ResBody = any, L extends Record<string, unknown> = {}> = TValidationErrorHandler<B, {}, {}, ResBody, L>;
export type TQueryValidationErrorHandler<Q extends Record<string, string>  = {}, ResBody = any, L extends Record<string, unknown> = {}> = TValidationErrorHandler<{}, Q, {}, ResBody, L>;
export type TParamsValidationErrorHandler<P extends Record<string, string> = {}, ResBody = any, L extends Record<string, unknown> = {}> = TValidationErrorHandler<{}, {}, P, ResBody, L>;

export type TRequestValidator<B extends Record<string, unknown> = {}, Q extends Record<string, string> = {}, P extends Record<string, string> = {}, ResBody = any, L extends Record<string, unknown> = {}> = (schemas: IRequestValidationSchema<B, Q, P>, errorHandler?: TValidationErrorHandler<B, Q, P, ResBody, L> | null) => RequestHandler<P, ResBody, B, Q, L>;


const v = new Validator();


export const RequestValidator = <B extends Record<string, unknown> = {}, Q extends Record<string, string> = {}, P extends Record<string, string> = {}, ResBody = any, L extends Record<string, unknown> = {}>(schemas: IRequestValidationSchema<B, Q, P>, errorHandler?: TValidationErrorHandler<B, Q, P, ResBody, L> | null): RequestHandler<P, ResBody, B, Q, L> =>
{
   const checkFuncs: Array<{key: string, checkFunc: TCheckFunc}> = [];

   for (const key in schemas) {
      if (Boolean(schemas[key]) === true) {
         checkFuncs.push({
            key,
            checkFunc: v.compile(schemas[key])
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



export const BodyValidator = <B extends Record<string, unknown> = {}, ResBody = any, L extends Record<string, unknown> = {}>(schema: ValidationSchema<B>, errorHandler?: TBodyValidationErrorHandler<B, ResBody, L> | null): RequestHandler<{}, ResBody, B, {}, L> =>
{
   const checkFunc: TCheckFunc = v.compile(schema);

   return async (req, res, next): Promise<void> =>
   {
      try {
         const result = await checkFunc(req.body);
         if (result !== true) {
            const errors: IBodyValidationError = {
               body: result,
            };

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


export const QueryValidator = <Q extends Record<string, string> = {}, ResBody = any, L extends Record<string, unknown> = {}>(schema: ValidationSchema<Q>, errorHandler?: TQueryValidationErrorHandler<Q, ResBody, L> | null): RequestHandler<{}, ResBody, {}, Q, L> =>
{
   const checkFunc: TCheckFunc = v.compile(schema);

   return async (req, res, next): Promise<void> =>
   {
      try {
         const result = await checkFunc(req.query);
         if (result !== true) {
            const errors: IQueryValidationError = {
               query: result,
            };

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


export const ParamsValidator = <P extends Record<string, string> = {}, ResBody = any, L extends Record<string, unknown> = {}>(schema: ValidationSchema<P>, errorHandler?: TParamsValidationErrorHandler<P, ResBody, L> | null): RequestHandler<P, ResBody, {}, {}, L> =>
{
   const checkFunc: TCheckFunc = v.compile(schema);

   return async (req, res, next): Promise<void> =>
   {
      try {
         const result = await checkFunc(req.params);
         if (result !== true) {
            const errors: IParamsValidationError = {
               params: result,
            };

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


export const DefaultRequestValidator = <B extends Record<string, unknown> = {}, Q extends Record<string, string> = {}, P extends Record<string, string> = {}, ResBody = any, L extends Record<string, unknown> = {}>(schemas: IRequestValidationSchema<B, Q, P>): RequestHandler<P, ResBody, B, Q, L> => {
   return RequestValidator(schemas, defaultRequestValidatorHandler);
};