import { IUserRole } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: IUserRole;
      };
      requestId?: string;
      startTime?: number;
    }
  }
}

export {};