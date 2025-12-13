# Authentication System Documentation

## Overview

A complete authentication system has been implemented with both frontend and backend components. The system includes:

- User registration (sign up) with email and password
- User login with JWT token authentication
- Password hashing using bcrypt
- Input validation and error handling
- Protected routes with middleware
- In-memory user storage (can be replaced with MongoDB)
- Modern, responsive UI with Tailwind CSS

## Backend API Endpoints

### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation Rules:**
- Email must be valid format
- Password must be at least 8 characters

### POST /api/auth/login
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### GET /api/auth/verify
Verify a JWT token and get user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Frontend Components

### Auth Pages

- **`/auth`** - Authentication page with toggle between Sign Up and Login forms
- **`/dashboard`** - Protected dashboard page (requires authentication)

### Components

- **`SignUpForm`** - Registration form with password strength validation
- **`LoginForm`** - Login form with email/password validation
- **`ProtectedRoute`** - Wrapper component for protecting routes
- **`AuthContext`** - React context for managing authentication state

## Features

### Password Validation
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Token Management
- JWT tokens stored in `localStorage`
- Automatic token verification on app load
- Token expiration handling (7 days default)
- Automatic logout on token expiration

### Protected Routes
- Dashboard page automatically redirects to `/auth` if not authenticated
- Auth page automatically redirects to `/dashboard` if already authenticated

### UI Features
- Loading states during API calls
- Error messages for failed attempts
- Success notifications
- Responsive design
- Dark mode support (inherits from app theme)

## Usage

### Setting Up Environment Variables

Add to your `.env.local` file:
```
JWT_SECRET=your-secret-key-change-in-production
```

**Important:** Use a strong, random secret key in production!

### Using Authentication in Components

```tsx
import { useAuth } from '@/app/contexts/AuthContext';

function MyComponent() {
  const { user, token, login, logout, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```tsx
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is protected</div>
    </ProtectedRoute>
  );
}
```

### Making Authenticated API Calls

```tsx
const { token } = useAuth();

const response = await fetch('/api/some-protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Backend Middleware

The `authMiddleware` function can be used to protect API routes:

```tsx
import { authMiddleware } from '@/app/lib/authMiddleware';

async function handler(req: NextRequest & { userId?: string }) {
  // req.userId is available here
  return NextResponse.json({ userId: req.userId });
}

export const GET = authMiddleware(handler);
```

## Storage

Currently, users are stored in-memory. To use a database:

1. Replace the `users` Map in `src/app/lib/auth.ts` with database calls
2. Update `createUser`, `findUserByEmail`, and `findUserById` functions
3. The rest of the system will work without changes

## Security Notes

- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens expire after 7 days (configurable)
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Email addresses are normalized (lowercase, trimmed)
- Input validation on both client and server

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `/auth`
3. Create an account with a valid email and strong password
4. You'll be automatically logged in and redirected to `/dashboard`
5. Try logging out and logging back in
6. Try accessing `/dashboard` without being logged in (should redirect to `/auth`)

## Next Steps

- Add password reset functionality
- Add email verification
- Replace in-memory storage with a database
- Add rate limiting for login attempts
- Implement refresh tokens
- Add social authentication (Google, GitHub, etc.)

