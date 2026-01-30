import { z } from 'zod';
import { 
  insertJobSchema, 
  insertApplicationSchema, 
  jobs, 
  employers, 
  applications,
  tenants
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
    code: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  jobs: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs',
      input: z.object({
        search: z.string().optional(),
        location: z.string().optional(),
        employmentType: z.string().optional(),
        employerId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof jobs.$inferSelect & { employer: typeof employers.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/jobs/:id',
      responses: {
        200: z.custom<typeof jobs.$inferSelect & { employer: typeof employers.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/jobs',
      input: insertJobSchema,
      responses: {
        201: z.custom<typeof jobs.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  applications: {
    create: {
      method: 'POST' as const,
      path: '/api/applications',
      input: insertApplicationSchema,
      responses: {
        201: z.custom<typeof applications.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  employers: {
    list: {
      method: 'GET' as const,
      path: '/api/employers',
      responses: {
        200: z.array(z.custom<typeof employers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/employers/:id',
      responses: {
        200: z.custom<typeof employers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  tenants: {
    current: {
      method: 'GET' as const,
      path: '/api/tenant',
      responses: {
        200: z.custom<typeof tenants.$inferSelect>(),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
