declare namespace Express {
  export interface Request {
    tenantId?: number;
    tenant?: any;
    user?: {
      id: number;
      email: string;
      role: string;
      tenantId: number;
      employerId?: number;
    };
  }
}
