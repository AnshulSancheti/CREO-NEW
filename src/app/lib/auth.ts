import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  createdAt: Date;
}

// In-memory user store (replace with database in production)
const users: Map<string, User> = new Map();

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create user
export async function createUser(email: string, password: string): Promise<User> {
  const id = generateId();
  const hashedPassword = await hashPassword(password);
  const user: User = {
    id,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    createdAt: new Date(),
  };
  users.set(id, user);
  return user;
}

// Find user by email
export function findUserByEmail(email: string): User | undefined {
  const normalizedEmail = email.toLowerCase().trim();
  return Array.from(users.values()).find((u) => u.email === normalizedEmail);
}

// Find user by ID
export function findUserById(id: string): User | undefined {
  return users.get(id);
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Get all users (for debugging)
export function getAllUsers(): User[] {
  return Array.from(users.values());
}

