import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';
const TOKEN_EXPIRES_IN = '2h';

export type TokenPayload = {
  userId: string;
  email: string;
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);

export const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

export const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

export const validatePassword = (password: string) =>
  password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

export const generateToken = (payload: TokenPayload) =>
  jwt.sign(payload, AUTH_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, AUTH_SECRET) as TokenPayload & jwt.JwtPayload;
  } catch {
    return null;
  }
};

export const extractBearerToken = (req: NextRequest) => {
  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.replace('Bearer ', '').trim();
  }
  return null;
};
