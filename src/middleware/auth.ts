import { NextRequest, NextResponse } from 'next/server';

/**
 * Placeholder authentication middleware for CREO
 * 
 * TODO: Implement proper authentication with:
 * - JWT token validation
 * - OAuth provider integration (Google, GitHub, etc.)
 * - Session management
 * - Token refresh logic
 * - Rate limiting
 * 
 * For now, this extracts userId from headers for development/testing
 */

export type AuthContext = {
  userId: string;
  isAuthenticated: boolean;
};

/**
 * Extract user ID from request
 * Currently accepts userId from:
 * 1. Authorization header: "Bearer {userId}"
 * 2. x-user-id header
 * 3. Query parameter: ?userId=...
 * 
 * @param request - Next.js request object
 * @returns AuthContext with userId and authentication status
 */
export function extractAuthContext(request: NextRequest): AuthContext {
  // Method 1: Authorization Bearer token (placeholder)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const userId = authHeader.substring(7);
    if (userId) {
      return { userId, isAuthenticated: true };
    }
  }

  // Method 2: x-user-id header
  const userIdHeader = request.headers.get('x-user-id');
  if (userIdHeader) {
    return { userId: userIdHeader, isAuthenticated: true };
  }

  // Method 3: Query parameter (for development only)
  const url = new URL(request.url);
  const userIdQuery = url.searchParams.get('userId');
  if (userIdQuery) {
    return { userId: userIdQuery, isAuthenticated: true };
  }

  // No authentication found
  return { userId: '', isAuthenticated: false };
}

/**
 * Middleware wrapper to require authentication
 * 
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = requireAuth(request);
 *   if (auth instanceof NextResponse) return auth; // Error response
 *   
 *   const { userId } = auth;
 *   // ... use userId
 * }
 * ```
 */
export function requireAuth(request: NextRequest): AuthContext | NextResponse {
  const auth = extractAuthContext(request);

  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please provide userId in Authorization header or x-user-id header.'
        }
      },
      { status: 401 }
    );
  }

  return auth;
}

/**
 * Optional authentication - doesn't fail if no auth provided
 */
export function optionalAuth(request: NextRequest): AuthContext {
  return extractAuthContext(request);
}

/**
 * TODO: Future authentication features to implement:
 * 
 * 1. JWT Token Validation:
 *    - Verify token signature
 *    - Check expiration
 *    - Extract user claims
 * 
 * 2. OAuth Integration:
 *    - Google OAuth 2.0
 *    - GitHub OAuth
 *    - Support for custom providers
 * 
 * 3. Session Management:
 *    - Redis-based sessions
 *    - Session expiry
 *    - Refresh token rotation
 * 
 * 4. Security:
 *    - Rate limiting per user
 *    - CSRF protection
 *    - XSS prevention headers
 * 
 * 5. Role-Based Access Control (RBAC):
 *    - User roles (student, instructor, admin)
 *    - Permission checks
 *    - Resource-level authorization
 */
