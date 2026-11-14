/**
 * validate({ body, query, params }) parses with Zod and exposes the cleaned values on req.valid.
 * Unknown keys are stripped (Zod object default), which also blocks mass-assignment.
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    req.valid = {
      body: schemas.body ? schemas.body.parse(req.body ?? {}) : req.body,
      query: schemas.query ? schemas.query.parse(req.query ?? {}) : req.query,
      params: schemas.params ? schemas.params.parse(req.params ?? {}) : req.params,
    };
    next();
  } catch (err) {
    next(err);
  }
};
