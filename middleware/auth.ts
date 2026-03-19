import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    medId: string;
    role: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      console.error('JWT Verify Error:', err.message);
      // Return 401 instead of 403 for invalid tokens to prevent WAF from intercepting 403s
      return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
    
    // Check if user still exists in the database (handles container restarts wiping the DB)
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
      if (!user) {
        console.error(`User ID ${decoded.id} not found in database. Forcing logout.`);
        return res.status(401).json({ error: 'User session invalid. Please log in again.' });
      }
      req.user = decoded;
      next();
    } catch (dbErr) {
      console.error('Database error in authenticateToken:', dbErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    console.error(`Admin access denied for user: ${req.user?.email} with role: ${req.user?.role}`);
    // Return 401 instead of 403 to prevent WAF from intercepting 403s
    return res.status(401).json({ error: 'Admin access required' });
  }
  next();
};
