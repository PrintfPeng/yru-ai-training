/**
 * Zod validation wrapper. Runs schema.parse on the given source
 * and REPLACES that source with the parsed (and coerced) value so
 * downstream handlers work with clean data.
 *
 * Usage:
 *   router.post('/', validate({ body: activityCreateSchema }), handler);
 *   router.get('/:id', validate({ params: idParamSchema }), handler);
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query)  req.query  = schemas.query.parse(req.query);
    if (schemas.body)   req.body   = schemas.body.parse(req.body);
    return next();
  } catch (err) {
    return next(err);
  }
};
