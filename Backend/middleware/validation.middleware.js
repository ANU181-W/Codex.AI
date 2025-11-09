const { z } = require('zod');
const { HttpError } = require('./error.middleware');

// Project Schemas
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
});

const idValidator = z.string()
  .min(1, "Project ID is required")
  .regex(/^[0-9a-fA-F-]+$/, "Project ID must contain only hexadecimal characters and hyphens")
  .transform((val) => val.toLowerCase());

const projectIdParam = z.object({ id: idValidator });
// Some routes use :projectId instead of :id; provide an alias schema to avoid param name mismatch errors
const projectIdParamAlt = z.object({ projectId: idValidator });

// File Schemas
const fileUploadSchema = z.object({
  files: z.array(z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    buffer: z.instanceof(Buffer),
    size: z.number()
  })).min(1, 'At least one file is required'),
});

const fileIdParam = z.object({
  id: z.string().uuid('Invalid file ID'),
});

// Export schemas for reuse
exports.schemas = {
  project: projectSchema,
  projectId: projectIdParam,
  projectIdAlt: projectIdParamAlt,
  fileUpload: fileUploadSchema,
  fileId: fileIdParam,
};

// Validation middleware factory
exports.validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request body if schema has body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      
      // Validate URL parameters if schema has params
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      
      // Validate query parameters if schema has query
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      
      // Validate file uploads if schema has files
      if (schema.files) {
        const files = req.files || [];
        await schema.files.parseAsync({ files });
      }
      
      next();
    } catch (err) {
      if (err instanceof z.ZodError && Array.isArray(err.errors)) {
        const errors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        
        next(new HttpError(`Validation failed: ${errors[0].message}`, 400));
      } else {
        // Handle non-Zod errors or malformed validation errors
        next(new HttpError(err.message || 'Validation failed', 400));
      }
    }
  };
};