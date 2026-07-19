import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Access token is required', 401);
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired access token', 401);
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as any;
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but it's optional so we continue
    }
  }
  next();
};
